// firmware/src/FusionNode.ino
// Triple-sensor forest detection node with tiered power management

#include <Arduino.h>
#include <ArduinoJson.h>
#include <Adafruit_MLX90640.h>

// ─── Hardware pins ───
#define PIR_PIN         32    // AM312 PIR wake-up
#define GEO_PIN         34    // Geophone analog input
#define TOF_RX          16
#define TOF_TX          17

// ─── Thresholds ───
#define PIR_WAKE_DELAY_MS     50    // settle after PIR
#define SAMPLE_WINDOW_MS      2500  // sample sensors for 2.5s
#define GEO_MIN_HZ            0.8   // below this = not a footstep
#define GEO_MAX_HZ            4.0   // above this = not a footstep
#define THERMAL_HUMAN_MIN_C   30.0  // colder than this = not a person
#define THERMAL_HUMAN_MAX_C   40.0
#define COOLDOWN_MS           300000 // 5 min lockout after event
#define FUSION_MIN_CONF       60    // below this = log locally, don't send

// ─── State machine ───
enum NodeState {
  STATE_SLEEP,      // ~50µA   — PIR only, MCU + radio off
  STATE_WAKE,       // ~250mA  — powering up sensors
  STATE_ANALYZE,    // ~40mA   — sampling, running fusion
  STATE_TRANSMIT,   // ~120mA  — sending LoRa packet
  STATE_COOLDOWN    // ~50µA   — lockout to prevent spam
};

NodeState currentState = STATE_SLEEP;
unsigned long stateEnteredAt = 0;
unsigned long cooldownUntil = 0;

Adafruit_MLX90640 thermal;
float thermalFrame[32 * 24];

// ─── Sensor reading functions ───
struct SensorResult {
  bool fired;
  uint8_t magnitude;   // 0-255
  uint8_t confidence;  // 0-100
};

SensorResult readPIR() {
  // PIR fired = digital HIGH. Magnitude = how long it stayed high.
  // Long activation = likely human. Brief = likely wind/animal.
  SensorResult r = { false, 0, 0 };
  unsigned long start = millis();
  while (digitalRead(PIR_PIN) == HIGH && millis() - start < 500) {
    delay(10);
  }
  unsigned long duration = millis() - start;
  if (duration > 20) {
    r.fired = true;
    r.magnitude = min(255UL, duration);
    // Longer activation = more confidence
    r.confidence = min(100UL, duration / 3);
  }
  return r;
}

SensorResult readGeophone() {
  // Sample analog for 2 seconds, run FFT, check for footstep frequency band
  SensorResult r = { false, 0, 0 };
  unsigned long start = millis();
  uint16_t samples[256];
  int idx = 0;
  while (millis() - start < SAMPLE_WINDOW_MS && idx < 256) {
    samples[idx++] = analogRead(GEO_PIN);
    delayMicroseconds(8000); // 125Hz sample rate
  }
  
  // Simplified: count zero crossings to estimate dominant frequency
  int zeroCrossings = 0;
  for (int i = 1; i < idx; i++) {
    if ((samples[i-1] < 2048) != (samples[i] < 2048)) zeroCrossings++;
  }
  float durationSec = (millis() - start) / 1000.0;
  float freqHz = (zeroCrossings / 2.0) / durationSec;
  
  if (freqHz >= GEO_MIN_HZ && freqHz <= GEO_MAX_HZ) {
    // Peak-to-peak amplitude
    uint16_t minVal = 4096, maxVal = 0;
    for (int i = 0; i < idx; i++) {
      if (samples[i] < minVal) minVal = samples[i];
      if (samples[i] > maxVal) maxVal = samples[i];
    }
    uint16_t amplitude = maxVal - minVal;
    if (amplitude > 50) {  // noise floor
      r.fired = true;
      r.magnitude = min(255, amplitude / 8);
      // Stronger signal + correct frequency band = higher confidence
      r.confidence = min(100, (int)(r.magnitude * 0.8 + 20));
    }
  }
  return r;
}

SensorResult readThermal() {
  SensorResult r = { false, 0, 0 };
  if (!thermal.getFrame(thermalFrame)) return r;
  
  // Count pixels in human body temperature range
  int humanPixels = 0;
  float maxTemp = 0;
  for (int i = 0; i < 32 * 24; i++) {
    if (thermalFrame[i] >= THERMAL_HUMAN_MIN_C && 
        thermalFrame[i] <= THERMAL_HUMAN_MAX_C) {
      humanPixels++;
    }
    if (thermalFrame[i] > maxTemp) maxTemp = thermalFrame[i];
  }
  
  // A person is roughly 50-200 pixels on 32x24 MLX
  if (humanPixels >= 30) {
    r.fired = true;
    r.magnitude = min(255, humanPixels);
    r.confidence = min(100, humanPixels / 2);
  }
  return r;
}

// ─── Fusion logic — the edge-computing heart of the node ───
struct FusionResult {
  bool confirmed;
  uint8_t srcBitmask;
  uint8_t fusedMagnitude;
  uint8_t fusedConfidence;
};

FusionResult fuseSensors(SensorResult pir, SensorResult geo, SensorResult thm) {
  FusionResult f = { false, 0, 0, 0 };
  
  if (pir.fired)  f.srcBitmask |= 0b00000001;
  if (geo.fired)  f.srcBitmask |= 0b00000010;
  if (thm.fired)  f.srcBitmask |= 0b00000100;
  
  int activeCount = pir.fired + geo.fired + thm.fired;
  
  // Fusion rule: need 2+ sensors to confirm a human
  if (activeCount >= 2) {
    f.confirmed = true;
    // Weighted average — thermal is most reliable for stationary,
    // geophone for footsteps, PIR for wake-up only
    f.fusedMagnitude = (
      (pir.magnitude * 1) + 
      (geo.magnitude * 3) + 
      (thm.magnitude * 4)
    ) / 8;
    
    // Confidence compounds when sensors agree
    if (activeCount == 3) {
      f.fusedConfidence = min(100, (pir.confidence + geo.confidence + thm.confidence) / 2);
    } else {
      f.fusedConfidence = (pir.confidence + geo.confidence + thm.confidence) / 3;
    }
  }
  return f;
}

// ─── Main loop state machine ───
void loop() {
  unsigned long now = millis();
  
  switch (currentState) {
    case STATE_SLEEP:
      // PIR only. Everything else off.
      // Enter deep sleep — PIR interrupt wakes the MCU.
      if (digitalRead(PIR_PIN) == HIGH) {
        currentState = STATE_WAKE;
        stateEnteredAt = now;
      }
      break;
      
    case STATE_WAKE:
      // Power up geophone and thermal array
      delay(PIR_WAKE_DELAY_MS);
      wireThermal();
      currentState = STATE_ANALYZE;
      stateEnteredAt = now;
      break;
      
    case STATE_ANALYZE: {
      // Sample all three sensors
      SensorResult pir = readPIR();
      SensorResult geo = readGeophone();
      SensorResult thm = readThermal();
      
      FusionResult fusion = fuseSensors(pir, geo, thm);
      
      if (fusion.confirmed && fusion.fusedConfidence >= FUSION_MIN_CONF) {
        // Build payload
        StaticJsonDocument<256> doc;
        doc["typ"] = "SNS";
        doc["d"]["src"] = fusion.srcBitmask;
        doc["d"]["conf"] = fusion.fusedConfidence;
        doc["d"]["mag"] = fusion.fusedMagnitude;
        doc["d"]["peak_ms"] = (millis() - stateEnteredAt) / 1000;
        if (pir.fired) doc["d"]["pir"] = pir.magnitude;
        if (geo.fired) doc["d"]["geo"] = geo.magnitude;
        if (thm.fired) doc["d"]["thm"] = thm.magnitude;
        
        String out;
        serializeJson(doc, out);
        Serial2.println(out);  // to Meshtastic node
        
        currentState = STATE_TRANSMIT;
      } else {
        // Log locally, don't transmit (saves battery + mesh congestion)
        currentState = STATE_COOLDOWN;
        cooldownUntil = now + COOLDOWN_MS;
      }
      break;
    }
      
    case STATE_TRANSMIT:
      // Packet sent. Enter cooldown.
      currentState = STATE_COOLDOWN;
      cooldownUntil = now + COOLDOWN_MS;
      break;
      
    case STATE_COOLDOWN:
      if (now >= cooldownUntil) {
        // Power down sensors
        currentState = STATE_SLEEP;
      }
      break;
  }
}