/**
 * @file screamware_node.ino
 * @brief Personal alarm — pull-pin trigger, GPS beacon, serial bridge to Meshtastic.
 * 
 * On pin pull:
 *   1. Fire siren immediately
 *   2. Read GPS origin
 *   3. Send ALM envelope to Meshtastic tag via serial
 *   4. Continue sending HBT position updates every 15s while moving
 *   5. On pin re-insert: send clear message, stop siren
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// ─── Configuration ───
#define NODE_ID            "TAG-8842"
#define TEAM_ID            1
#define ALARM_TYPE         "SCR"    // "SCR" = screaming, "SIL" = silent
#define POSITION_INTERVAL  15000    // ms between position updates
#define COOLDOWN_MS        300000

// ─── Pins ───
#define REED_SWITCH_PIN    D1
#define SIREN_PIN          D2
#define GPS_RX             D6
#define GPS_TX             D7
#define MESH_SERIAL        Serial2

// ─── Peripherals ───
TinyGPSPlus gps;
HardwareSerial GPSSerial(1);

// ─── State ───
bool alarmActive = false;
uint32_t seqCounter = 0;
unsigned long lastPositionSent = 0;
unsigned long alarmTriggeredAt = 0;
double originLat = 0.0;
double originLon = 0.0;
bool originCaptured = false;

// ─── Packet builder ───
String buildEnvelope(const char* typ, JsonObject payloadFn) {
  StaticJsonDocument<512> doc;
  doc["v"] = 1;
  doc["id"] = String(millis(), HEX);
  doc["nid"] = NODE_ID;
  doc["typ"] = typ;
  doc["sim"] = 0;
  doc["ts"] = (uint32_t)(millis() / 1000);
  doc["seq"] = ++seqCounter;
  doc["sig"] = "00000000";
  doc["algo"] = 1;
  doc["prio"] = (strcmp(typ, "ALM") == 0) ? 3 : 1;
  doc["ack"] = (strcmp(typ, "ALM") == 0) ? 1 : 0;
  doc["hops"] = 0;
  doc["chn"] = 1;
  doc["cap"] = (1 << 0) | (1 << 2);  // GPS + AUDIO = 5
  doc["team_id"] = TEAM_ID;
  
  JsonObject d = doc.createNestedObject("d");
  payloadFn(d);
  
  String out;
  serializeJson(doc, out);
  return out;
}

void sendAlarmPacket() {
  String packet = buildEnvelope("ALM", [](JsonObject d) {
    d["mode"] = ALARM_TYPE;
    d["tts"] = (strcmp(ALARM_TYPE, "SCR") == 0) ? 1 : 0;
    d["lat"] = originLat;
    d["lon"] = originLon;
    d["ts_origin"] = (uint32_t)(millis() / 1000);
  });
  MESH_SERIAL.println(packet);
  Serial.println("[ALARM] " + packet);
}

void sendPositionUpdate() {
  double lat = gps.location.isValid() ? gps.location.lat() : originLat;
  double lon = gps.location.isValid() ? gps.location.lng() : originLon;
  
  String packet = buildEnvelope("HBT", [lat, lon](JsonObject d) {
    d["bat"] = 94;  // TODO: read real battery
    d["lat"] = lat;
    d["lon"] = lon;
    d["mot"] = "walk";
    d["alarm"] = 1;
  });
  MESH_SERIAL.println(packet);
  Serial.println("[POS] " + packet);
}

void triggerAlarm() {
  alarmActive = true;
  alarmTriggeredAt = millis();
  digitalWrite(SIREN_PIN, HIGH);
  
  // Capture origin GPS (wait up to 5s for a fix)
  unsigned long waitStart = millis();
  while (!gps.location.isValid() && millis() - waitStart < 5000) {
    while (GPSSerial.available()) gps.encode(GPSSerial.read());
    delay(50);
  }
  
  if (gps.location.isValid()) {
    originLat = gps.location.lat();
    originLon = gps.location.lng();
    originCaptured = true;
  }
  
  sendAlarmPacket();
  lastPositionSent = millis();
}

void clearAlarm() {
  alarmActive = false;
  digitalWrite(SIREN_PIN, LOW);
  
  String packet = buildEnvelope("ALM", [](JsonObject d) {
    d["mode"] = "CLR";
    d["ts_clear"] = (uint32_t)(millis() / 1000);
  });
  MESH_SERIAL.println(packet);
  Serial.println("[CLEAR] " + packet);
}

void setup() {
  Serial.begin(115200);
  MESH_SERIAL.begin(115200, SERIAL_8N1, 16, 17);
  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  
  pinMode(REED_SWITCH_PIN, INPUT_PULLUP);
  pinMode(SIREN_PIN, OUTPUT);
  digitalWrite(SIREN_PIN, LOW);
  
  // Check pin state on boot
  if (digitalRead(REED_SWITCH_PIN) == LOW) {
    // Pin is already pulled — trigger immediately
    triggerAlarm();
  } else {
    Serial.println("[BOOT] Personal alarm armed. Pin in place.");
  }
}

void loop() {
  // Feed GPS parser continuously
  while (GPSSerial.available()) gps.encode(GPSSerial.read());
  
  // Detect pin pull
  if (!alarmActive && digitalRead(REED_SWITCH_PIN) == LOW) {
    triggerAlarm();
  }
  
  // Detect pin re-insert
  if (alarmActive && digitalRead(REED_SWITCH_PIN) == HIGH) {
    clearAlarm();
  }
  
  // Send position updates while alarm active
  if (alarmActive && millis() - lastPositionSent >= POSITION_INTERVAL) {
    sendPositionUpdate();
    lastPositionSent = millis();
  }
}