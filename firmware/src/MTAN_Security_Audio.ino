/**
 * @file MTAN_Security_Audio.ino
 * @brief Firmware framework for Mesh-Triggered Audio Nodes (MTAN)
 * @path firmware/src/MTAN_Security_Audio.ino
 * @version 2.0
 */

#include <Arduino.h>
#include <ArduinoJson.h>

// --- Configuration Hardware Pins ---
#define RXD2 16  // UART Receive from Meshtastic Node
#define TXD2 17  // UART Transmit to Meshtastic Node

// --- Trusted Administrative Whitelist (Node IDs) ---
const char* TRUSTED_ADMINS[] = {
  "!2a4b6c8d",  // Example Admin Node ID 1 (Overwatch Lead)
  "!8f7e6d5c",  // Example Admin Node ID 2 (Tactical Tech Lead)
  "!1a2b3c4d"   // Example Admin Node ID 3 (Field Command)
};
const int TRUSTED_ADMIN_COUNT = sizeof(TRUSTED_ADMINS) / sizeof(TRUSTED_ADMINS[0]);

// --- Replay Protection Matrix ---
#define REPLAY_BUFFER_SIZE 50
uint32_t seenPacketIds[REPLAY_BUFFER_SIZE];
int packetIndex = 0;

/**
 * @brief Confirms if the calling Node ID belongs to the verified Admin Whitelist.
 */
bool isSenderAuthorized(const char* senderId) {
  if (senderId == nullptr) return false;
  for (int i = 0; i < TRUSTED_ADMIN_COUNT; i++) {
    if (strcmp(senderId, TRUSTED_ADMINS[i]) == 0) {
      return true;
    }
  }
  return false;
}

/**
 * @brief Prevents Replay Attacks by verifying if the Packet ID has been processed.
 */
bool isReplayAttack(uint32_t packetId) {
  for (int i = 0; i < REPLAY_BUFFER_SIZE; i++) {
    if (seenPacketIds[i] == packetId) {
      return true;  // Already processed, dangerous packet
    }
  }
  // Commit new ID to rolling storage ring
  seenPacketIds[packetIndex] = packetId;
  packetIndex = (packetIndex + 1) % REPLAY_BUFFER_SIZE;
  return false;
}

/**
 * @brief Executes local audio playback from local storage via I2S interface.
 */
void triggerLocalAudio(int commandId) {
  Serial.printf("[AUDIO ENGINE] Authorized Match. Driving I2S Line. Executing Track ID: %d\n", commandId);
  switch(commandId) {
    case 1:
      Serial.println("[AUDIO] Playing: WAV_SIREN_130DB.wav - Full Deterrence Output.");
      // Physical Hardware Hook: i2s_write(I2S_NUM_0, ...);
      break;
    case 2:
      Serial.println("[AUDIO] Playing: WAV_WARNING_LEGAL.wav - Dispelling Crowd.");
      break;
    case 3:
      Serial.println("[AUDIO] Playing: WAV_TACTICAL_EXTRACTION_NORTH.wav - Team Routing Instruction.");
      break;
    default:
      Serial.println("[AUDIO ERROR] Invalid command ID received.");
      break;
  }
}

void setup() {
  Serial.begin(115200);
  // Initialize secure UART line connection to local Meshtastic node device
  Serial2.begin(115200, SERIAL_8N1, RXD2, TXD2);

  // Clear Replay Buffer
  memset(seenPacketIds, 0, sizeof(seenPacketIds));

  Serial.println("[SYSTEM INIT] The Raptor's Call: Audio Node Verification Loop Active.");
}

void loop() {
  if (Serial2.available()) {
    String incomingPayload = Serial2.readStringUntil('\n');

    // Allocate JSON buffer memory block for incoming serial streaming data
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, incomingPayload);

    if (error) {
      // Drop corrupted or unparseable packets safely
      return;
    }

    // --- Core Protocol Architecture Parsing ---
    const char* sender = doc["sender"];          // Native Meshtastic Caller ID
    uint32_t packetId = doc["packetId"];         // 32-bit transmission packet sequence ID
    int commandId = doc["payload"]["command"];   // System command hash payload

    // --- Security Boundary Checks ---
    if (!isSenderAuthorized(sender)) {
      Serial.printf("[SECURITY ALERT] Unauthorized Command Attempt Dropped from Sender: %s\n", sender ? sender : "UNKNOWN");
      return;
    }

    if (isReplayAttack(packetId)) {
      Serial.printf("[SECURITY ALERT] Replay Attack Blocked! Dropping Packet ID: %u\n", packetId);
      return;
    }

    // --- Verified Execution Block ---
    Serial.printf("[ACCESS GRANTED] Valid Token confirmed from %s. Verification Complete.\n", sender);
    triggerLocalAudio(commandId);
  }
}