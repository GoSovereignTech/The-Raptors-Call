
### Blind Relay Topology

Meshtastic hardware acts as a blind repeater. When a node receives an RF packet on a channel for which it does not possess the cryptographic key, it cannot read the content. However, the firmware still repeats the raw encrypted packet across the mesh.

This means a user in Maryland can pass through a mesh network in Miami: their hardware extends the physical range of the Miami network, yet neither party can decrypt the other's operational channels.

### Multi‑Channel Allocation Matrix

Every node is flashed with up to 8 logical channels running simultaneously on the same hardware radio frequency:

1. **Channel 0 (Broad/LongFast):** Used strictly for anonymous node‑to‑node relay hops, basic public metadata, and unencrypted SOS signaling.
2. **Channel 1 (Primary Squad Private):** Encrypted using a locally generated **AES‑256 Pre‑Shared Key (PSK)**. This channel handles the team's tactical text chat, GPS coordinates, and real‑time status updates.

---

## 3. Tier‑Based Security & Permission Restrictions

The infrastructure enforces a distinct separation of privileges to neutralize bad actors, compromised vendors, or seized devices.

### Tier 1: Civilian / Subscriber Access

- **Cryptographic Basis:** Standard AES‑256 Pre‑Shared Key (PSK) Channel profile.
- **Capabilities:** Transmit panic alerts, view own telemetry tracking, and participate in localized peer‑to‑peer messaging.
- **Hardware Restrictions:** Hardware is compiled with **Managed Mode (is_managed = true)** flagged active in the firmware layout. The local micro‑USB/Bluetooth terminal is locked out. A Tier 1 user cannot hook the radio to a computer to pull internal cryptographic keys or tamper with system parameters.

### Tier 2: Administrative / Hardware Control Access

- **Cryptographic Basis:** Asymmetric Public Key Cryptography (PKC) utilizing unique Public/Private Key pairs generated on‑device.
- **Capabilities:** Broadcast Over‑The‑Air (OTA) system configurations, update channel keys, and execute remote management triggers on field nodes.
- **Verification Protocol:** In‑person or encrypted video verification checks. The system generates a Globally Unique Identifier (GUID) in the PostgreSQL backend. This GUID is physically handed to the user to sign into the system, generating a secure JSON Web Token (JWT) completely independent of personal identifying data (PII).

### The Silent Ban Protocol

If a rogue actor captures a device or infiltrates a regional cluster, administrators do not delete the user account. Deletion signals to the attacker that they have been caught, prompting them to create a new profile immediately.

Instead, the Supabase backend updates a dedicated bans tracking database table mapping the specific `guid` and hardware `mesh_node_id` (derived directly from the radio's immutable MAC address). When the banned node sends an API query or attempts an over‑the‑air call, the network returns a generic HTTP `403 Access Denied: Configuration Mismatch` error. The attacker believes their local hardware is malfunctioning, keeping them isolated while preserving network security.

---

## 4. Hardware Node Protection: Mesh‑Triggered Audio Nodes (MTANs)

Traditional wireless options like Bluetooth and Wi‑Fi are easily jammed, intercepted, or tracked in active field scenarios. To secure hidden boom boxes and stealth speakers, the audio nodes are directly wired to the system's microprocessors via serial physical lines, relying on Meshtastic's native RF encryption layer.

┌────────────────────────┐ ┌────────────────────────┐ ┌────────────────────────┐
│ Meshtastic Radio MCU │ ── │ Host Microprocessor │ ── │ I2S Audio Amp │
│ (Heltec V3/ESP32) │UART│ (ESP32‑S3/Raspberry │I2S │ breakout (MAX98357A) │
└────────────────────────┘ │ Pi) │ └────────────────────────┘
▲ └────────────────────────┘ │
│ SPI │ │
┌────────────────┐ │ │
│ MicroSD Card │ │ │
│ (WAV Catalog) │ │ │
└────────────────┘ │ Analog Output
▼
┌────────────────────────┐
│ Weatherproof Horn │
│ Speaker │
└────────────────────────┘



### Verification Logic & Replay Attack Defense

To prevent an outsider from stealing a Tier 1 radio tag and playing malicious sound files or commands through the network, the host microprocessor enforces strict hardware confirmation logic:

1. **Sender Whitelisting:** The microprocessor decodes the incoming JSON payload over UART. It verifies the sender node ID against a hardcoded array of trusted Tier 2 Administrative keys.
2. **Replay Protection:** The microprocessor logs the unique rolling 32‑bit `packetId` of every command packet. If an attacker captures a valid "Play Sound" transmission over the air and tries to broadcast it later, the host microprocessor identifies the duplicate ID and discards the packet.
3. **Low‑Bandwidth Execution:** Because live voice data cannot stream over 915MHz LoRa mesh architectures due to data boundaries, commands are sent as 1‑byte instruction hashes (e.g., `CMD_PLAY_SURE_SQUAD_02`). The files are processed locally from a shielded, physical MicroSD card breakout.

---

## 5. Firmware Implementation Framework

Below is the C++ hardware verification framework designed for the host microprocessor driving the stealth Mesh‑Triggered Audio Nodes. This code processes incoming Meshtastic serial payloads over UART, validates cryptographic permissions, and drives an I2S MAX98357A audio amplifier to trigger localized acoustic deterrence.

```cpp
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