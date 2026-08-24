# The-Raptors-Call: Off-Grid Telemetry Defense, Mesh Security & Community Safety (V2.0)

## 🌐 The Mission
The-Raptors-Call is an open-source, ultra-low-cost hardware and software system designed to mitigate isolation-targeted violence, covert surveillance, and unauthorized community infiltration. The system integrates high-decibel acoustic deterrents, localized mmWave radar, and decentralized telemetry over long-range radio (LoRa) mesh networks.

By deploying a hybrid network of low-power Meshtastic tripwire nodes and high-bandwidth Wi-Fi backhaul relays, the system establishes an invisible, automated security perimeter for hikers, late-night commuters, and vulnerable rural communities.

## 🔥 Key Features & Architecture
- **Off-Grid LoRa Mesh**: Encrypted telemetry and sensor triggers (motion/acoustic) relayed via 915MHz Meshtastic networks without cellular service.
- **The "Caller" Personal Alarm**: A wearable, shockproof TPU device with a 130dB siren and magnetic pull-pin. Pulling the pin immediately broadcasts a "First Impact" emergency packet.
- **The "Rewind" Forensic Engine**: An automated path-tracing tool that allows Admins to click a hostile node and instantly trace its historical movements backward to discover the entry point (road or trail) the intruder used.
- **Adversarial Soft-Ban System**: Offending users are silently kicked via a `bans` table. They receive a vague 403 error, preventing them from knowing if they are banned or if their hardware is broken, thwarting instant re-accounting.
- **Stress-Optimized Frontend**: A React-based dashboard featuring a rotating **SVG Radar Sweep** for instant situational awareness, multiple map overlays (Meshtastic node viewer, Proximity Chat), and color-coded alerts (Pink = At-Risk, Red = Hostile).
- **Zero-PII Anonymity**: Users are identified solely by a **GUID** (no emails, no names). The Admin conducts vetting in-person or via encrypted chat, handing the GUID on paper. This ensures immediate GDPR/CCPA compliance.

## 🎓 University & Developer Collaboration Opportunity
This repository is an active project seeking Mechanical Engineering, Computer Science, Electrical Engineering, and RF Network teams for capstone or sponsored research. We have fully published technical specifications and a live, functioning React dashboard ready for hardware integration.

**Open Capstone / Developer Tasks:**
- **Hardware:** 3D printing TPU enclosures for the personal alarm and smartphone radar dongles.
- **Firmware:** C++ radio programming for Meshtastic node integration.
- **Backend:** Building the Python WebSocket bridge to read USB serial data and broadcast it to the web dashboard.
- **Frontend:** Expanding the React component library for the Admin command center and AI-driven risk-pattern overlays.

## 📋 Project Status
- **Current Version**: V2.0.0-Beta
- **System Architects**: GoSovereignty Engineering Network
- **Status**: Core backend logic, frontend React dashboard, and mathematical trilateration libraries are complete. **Hardware integration via Python WebSocket is the primary active engineering gap.**

## 🛠️ Repository Structure
- **`/docs/`** - Protocol specifications, full V2 technical engineering spec, physical safety checklists, and JSON data models.
- **`/firmware/`** - Microcontroller source code (C++) utilizing RadioLib for raw 915MHz RF injection into the Meshtastic mesh.
- **`/hardware/`** - Schematic drawings, component Bill of Materials (BOM), and 3D printing parameters (`.stl` / `.step`) for shockproof TPU casing layouts.
- **`/web-dashboard/`** - React/JavaScript dashboard using `react-leaflet`, a local `storage.js` adapter for admin vetting, and `trilateration.js` for TDOA/RSSI coordinate triangulation.
- **`/assets/`** - Conceptual diagrams, Raptor logo vector SVG, and visual hardware documentation.

## 💻 Tech Stack Overview
- **Frontend:** React, Vite, TailwindCSS, `react-leaflet`, `lucide-react`
- **Backend/DB:** Supabase (PostgreSQL) & JWT Authentication via GUID
- **Bridge Scripts:** Python (utilizing `pyserial` and `socket.io`)
- **Firmware:** C++ / PlatformIO

## 📜 Licenses
To ensure maximum community accessibility while protecting localized manufacturing micro-economies, this project utilizes a tiered open-source framework:
- **Hardware Design**: CERN Open Hardware Licence v2 - Weakly Reciprocal ([CERN-OHL-W-2.0](LICENSE.hardware))
- **Software/Firmware**: GNU General Public License v3.0 ([GPL-3.0](LICENSE.software))
- **Documentation/Manuals**: Creative Commons Zero v1.0 Universal ([CC0 1.0](LICENSE.docs))

## 🤝 How to Contribute & Contact
If you are an embedded systems engineer, a front-end developer skilled in spatial mapping, or an RF field tester, please open an Issue or Pull Request. 
For coordination regarding capstone partnerships, localized resource distribution, or hardware scaling, please review the `/docs` directory and contact the network through GitHub Issues.

## ⚠️ Notice
This is an active humanitarian engineering and defense optimization project. **WARNING:** The Admin web dashboard (`/#/admin`) currently stores vetting data in browser `localStorage`. A production-grade Supabase database is recommended before entering any real-world member data.
