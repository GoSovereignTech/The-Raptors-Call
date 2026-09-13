/* 
In my earlier response I showed a file tree with separate .cpp files, but then I wrote readPIR(), readGeophone(), readThermal() inline in FusionNode.ino. And I never wrote readToF() or readIRBeam() at all.

Recommendation: Start with one file. Split later when it hurts.
For a project at your stage, separate .cpp files add friction:

You have to maintain .h header files alongside .cpp files

The Arduino IDE compiles them all — build times increase

Cross-file debugging is harder

You don't need it yet

Single-file approach (recommended now):

firmware/
└── screamware_forest_node/
    └── screamware_forest_node.ino    ← everything lives here

Split-file approach (recommended later):
When the file exceeds ~600 lines, or when two people are editing different sensors, split into:

text
firmware/
└── screamware_forest_node/
    ├── screamware_forest_node.ino    ← main + state machine
    ├── config.h                       ← pins + thresholds
    ├── sensors.h                      ← all sensor function declarations
    ├── sensors.cpp                    ← all sensor implementations
    └── fusion.cpp                     ← fusion logic
*/

/**
 * @file screamware_forest_node.ino
 * @brief Forest detection node — 5-sensor fusion with tiered power management.
 * @version 1.0
 * 
 * Sensors:
 *   1. PIR (AM312)             — wake-up trigger
 *   2. Geophone (PS-4.5B)      — footstep detection via LM358 amp
 *   3. Thermal (MLX90640)      — stationary human detection
 *   4. ToF (TF-Luna)           — optional path crossing
 *   5. IR Break-Beam           — optional choke point
 * 
 * State machine: SLEEP → WAKE → ANALYZE → TRANSMIT → COOLDOWN
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MLX90640.h>

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

// Pin assignments
#define PIR_PIN             32
#define GEO_PIN             34
#define TOF_RX              16
#define TOF_TX              17
#define IR_BEAM_PIN         25

// Node identity
#define NODE_ID             "NODE_FOREST_01"
#define TEAM_ID             1
#define MESH_SERIAL         Serial2

// Capability bitmask (matches app-side CAP constant)
#define CAP_MOTION          (1 << 4)   // 16
#define CAP_THERMAL         (1 << 5)   // 32
#define CAP_SEISMIC         (1 << 6)   // 64
#define CAP_TOF             (1 << 7)   // 128
#define CAP_IR_BEAM         (1 << 8)   // 256
#define CAP_FUSION          (1 << 9)   // 512

#define NODE_CAPABILITIES   (CAP_MOTION | CAP_THERMAL | CAP_SEISMIC | CAP_TOF | CAP_IR_BEAM | CAP_FUSION)

// Thresholds
#define PIR_WAKE_DELAY_MS   50
#define SAMPLE_WINDOW_MS    2500
#define GEO_MIN_HZ          0.8
#define GEO_MAX_HZ          4.0
#define THERMAL_HUMAN_MIN   30.0
#define THERMAL_HUMAN_MAX   40.0
#define TOF_CROSS_MIN_CM    30        // below this = object too close
#define TOF_CROSS_MAX_CM    150       // above this = no one there
#define COOLDOWN_MS         300000    // 5 minutes
#define FUSION_MIN_CONF     60

// ═══════════════════════════════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════════════════════════════

enum NodeState {
  STATE_SLEEP,
  STATE_WAKE,
  STATE_ANALYZE,
  STATE_TRANSMIT,
  STATE_COOLDOWN
};

NodeState currentState = STATE_SLEEP;
unsigned long stateEnteredAt = 0;
unsigned long cooldownUntil = 0;
uint32_t seqCounter = 0;

Adafruit_MLX90640 thermal;
float thermalFrame[32 * 24];

// ═══════════════════════════════════════════════════════════════
// SENSOR READ FUNCTIONS
// ═══════════════════════════════════════════════════════════════

struct SensorResult {
  bool fired;
  uint8_t magnitude;   // 0-255
  uint8_t confidence;  // 0-100
  uint8_t extra;       // sensor-specific (e.g. ToF cm/10, IR state)
};

SensorResult readPIR() {
  SensorResult r = { false, 0, 0, 0 };
  unsigned long start = millis();
  while (digitalRead(PIR_PIN) == HIGH && millis() - start < 500) {
    delay(10);
  }
  unsigned long duration = millis() - start;
  if (duration > 20) {
    r.fired = true;
    r.magnitude = min(255UL, duration);
    r.confidence = min(100UL, duration / 3);
  }
  return r;
}

SensorResult readGeophone() {
  SensorResult r = { false, 0, 0, 0 };
  unsigned long start = millis();
  uint16_t samples[256];
  int idx = 0;
  while (millis() - start < SAMPLE_WINDOW_MS && idx < 256) {
    samples[idx++] = analogRead(GEO_PIN);
    delayMicroseconds(8000);
  }
  
  // Zero-crossing frequency estimate
  int zeroCrossings = 0;
  for (int i = 1; i < idx; i++) {
    if ((samples[i-1] < 2048) != (samples[i] < 2048)) zeroCrossings++;
  }
  float durationSec = (millis() - start) / 1000.0;
  float freqHz = (zeroCrossings / 2.0) / durationSec;
  
  if (freqHz >= GEO_MIN_HZ && freqHz <= GEO_MAX_HZ) {
    uint16_t minVal = 4096, maxVal = 0;
    for (int i = 0; i < idx; i++) {
      if (samples[i] < minVal) minVal = samples[i];
      if (samples[i] > maxVal) maxVal = samples[i];
    }
    uint16_t amplitude = maxVal - minVal;
    if (amplitude > 50) {
      r.fired = true;
      r.magnitude = min(255, amplitude / 8);
      r.confidence = min(100, (int)(r.magnitude * 0.8 + 20));
    }
  }
  return r;
}

SensorResult readThermal() {
  SensorResult r = { false, 0, 0, 0 };
  if (!thermal.getFrame(thermalFrame)) return r;
  
  int humanPixels = 0;
  for (int i = 0; i < 32 * 24; i++) {
    if (thermalFrame[i] >= THERMAL_HUMAN_MIN && 
        thermalFrame[i] <= THERMAL_HUMAN_MAX) {
      humanPixels++;
    }
  }
  
  if (humanPixels >= 30) {
    r.fired = true;
    r.magnitude = min(255, humanPixels);
    r.confidence = min(100, humanPixels / 2);
  }
  return r;
}

SensorResult readToF() {
  SensorResult r = { false, 0, 0, 0 };
  // TF-Luna outputs 9-byte frames: 0x59 0x59 distL distH ...
  // Simplified: assume UART parser fills a global
  // In practice, use a library like TFmini or write a frame parser.
  // Placeholder logic: check for object within range
  uint16_t distCm = 0; // populate from ToF UART parser
  if (distCm > TOF_CROSS_MIN_CM && distCm < TOF_CROSS_MAX_CM) {
    r.fired = true;
    r.magnitude = min(255, 255 - (distCm / 2));  // closer = higher magnitude
    r.confidence = 90;
    r.extra = distCm / 10;  // decimeters
  }
  return r;
}

SensorResult readIRBeam() {
  SensorResult r = { false, 0, 0, 0 };
  // IR break-beam: HIGH = intact, LOW = broken
  if (digitalRead(IR_BEAM_PIN) == LOW) {
    r.fired = true;
    r.magnitude = 255;
    r.confidence = 100;
    r.extra = 1;
  }
  return r;
}

// ═══════════════════════════════════════════════════════════════
// FUSION
// ═══════════════════════════════════════════════════════════════

struct FusionResult {
  bool confirmed;
  uint16_t srcBitmask;
  uint8_t fusedMagnitude;
  uint8_t fusedConfidence;
};

FusionResult fuseSensors(SensorResult pir, SensorResult geo, 
                         SensorResult thm, SensorResult tof, SensorResult irb) {
  FusionResult f = { false, 0, 0, 0 };
  
  if (pir.fired) f.srcBitmask |= CAP_MOTION;
  if (thm.fired) f.srcBitmask |= CAP_THERMAL;
  if (geo.fired) f.srcBitmask |= CAP_SEISMIC;
  if (tof.fired) f.srcBitmask |= CAP_TOF;
  if (irb.fired) f.srcBitmask |= CAP_IR_BEAM;
  
  int activeCount = pir.fired + thm.fired + geo.fired + tof.fired + irb.fired;
  
  // IR beam alone is a confirmed event (100% reliable tripwire)
  if (irb.fired) {
    f.confirmed = true;
    f.fusedMagnitude = 255;
    f.fusedConfidence = 100;
    return f;
  }
  
  // ToF alone crossing = confirmed object
  if (tof.fired) {
    f.confirmed = true;
    f.fusedMagnitude = tof.magnitude;
    f.fusedConfidence = tof.confidence;
    return f;
  }
  
  // Fusion cluster: need 2+ of PIR/GEO/THERMAL
  if (activeCount >= 2) {
    f.confirmed = true;
    f.fusedMagnitude = (pir.magnitude * 1 + geo.magnitude * 3 + thm.magnitude * 4) / 8;
    
    if (activeCount == 3) {
      f.fusedConfidence = min(100, (pir.confidence + geo.confidence + thm.confidence) / 2);
    } else {
      f.fusedConfidence = (pir.confidence + geo.confidence + thm.confidence) / 3;
    }
  }
  return f;
}

// ═══════════════════════════════════════════════════════════════
// PACKET BUILDER
// ═══════════════════════════════════════════════════════════════

String buildSNSPacket(FusionResult fusion, SensorResult pir, SensorResult geo, 
                      SensorResult thm, SensorResult tof, SensorResult irb,
                      unsigned long peakMs) {
  StaticJsonDocument<512> doc;
  
  // Envelope
  doc["v"] = 1;
  doc["id"] = String(millis(), HEX);
  doc["nid"] = NODE_ID;
  doc["typ"] = "SNS";
  doc["sim"] = 0;
  doc["ts"] = (uint32_t)(millis() / 1000);
  doc["seq"] = ++seqCounter;
  doc["sig"] = "00000000";        // placeholder — real HMAC
  doc["algo"] = 1;
  doc["prio"] = 3;
  doc["ack"] = 0;
  doc["hops"] = 0;
  doc["chn"] = 1;
  doc["cap"] = NODE_CAPABILITIES;
  doc["team_id"] = TEAM_ID;
  
  // Payload
  doc["d"]["src"] = fusion.srcBitmask;
  doc["d"]["conf"] = fusion.fusedConfidence;
  doc["d"]["mag"] = fusion.fusedMagnitude;
  doc["d"]["peak_ms"] = peakMs;
  
  if (pir.fired) doc["d"]["pir"] = pir.magnitude;
  if (thm.fired) doc["d"]["thm"] = thm.magnitude;
  if (geo.fired) doc["d"]["geo"] = geo.magnitude;
  if (tof.fired) doc["d"]["tof"] = tof.extra;
  if (irb.fired) doc["d"]["irb"] = 1;
  
  String out;
  serializeJson(doc, out);
  return out;
}

// ═══════════════════════════════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════════════════════════════

void loop() {
  unsigned long now = millis();
  
  switch (currentState) {
    case STATE_SLEEP:
      if (digitalRead(PIR_PIN) == HIGH || digitalRead(IR_BEAM_PIN) == LOW) {
        currentState = STATE_WAKE;
        stateEnteredAt = now;
      }
      break;
      
    case STATE_WAKE:
      delay(PIR_WAKE_DELAY_MS);
      // Thermal init (only if not already initialized)
      thermal.begin(0x33);
      thermal.setMode(MLX90640_CHESS);
      thermal.setResolution(MLX90640_ADC_18BIT);
      currentState = STATE_ANALYZE;
      stateEnteredAt = now;
      break;
      
    case STATE_ANALYZE: {
      SensorResult pir = readPIR();
      SensorResult geo = readGeophone();
      SensorResult thm = readThermal();
      SensorResult tof = readToF();
      SensorResult irb = readIRBeam();
      
      FusionResult fusion = fuseSensors(pir, geo, thm, tof, irb);
      unsigned long peakMs = (millis() - stateEnteredAt) / 1000;
      
      if (fusion.confirmed && fusion.fusedConfidence >= FUSION_MIN_CONF) {
        String packet = buildSNSPacket(fusion, pir, geo, thm, tof, irb, peakMs);
        MESH_SERIAL.println(packet);
        Serial.println("[TRANSMIT] " + packet);
        currentState = STATE_TRANSMIT;
      } else {
        currentState = STATE_COOLDOWN;
        cooldownUntil = now + COOLDOWN_MS;
      }
      break;
    }
      
    case STATE_TRANSMIT:
      currentState = STATE_COOLDOWN;
      cooldownUntil = now + COOLDOWN_MS;
      break;
      
    case STATE_COOLDOWN:
      if (now >= cooldownUntil) {
        currentState = STATE_SLEEP;
      }
      break;
  }
}

void setup() {
  Serial.begin(115200);
  MESH_SERIAL.begin(115200, SERIAL_8N1, 16, 17);
  Wire.begin();
  
  pinMode(PIR_PIN, INPUT);
  pinMode(GEO_PIN, INPUT);
  pinMode(IR_BEAM_PIN, INPUT_PULLUP);
  
  Serial.println("[BOOT] Forest node online.");
  Serial.printf("[BOOT] Capabilities: 0x%X\n", NODE_CAPABILITIES);
}