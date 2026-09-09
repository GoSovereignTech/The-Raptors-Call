// deviceDetector.js

class DeviceDetector {
    constructor() {
        this.devices = {
            rakNode: null,
            radarDongle: null,
            power: null
        };
    }

    // Called when a USB device is connected
    async detectDevice(port) {
        // Request the device's USB descriptors
        const deviceInfo = await port.getInfo();
        console.log('USB Device Connected:', deviceInfo);

        // Check vendor ID and product ID
        const vendorId = deviceInfo.vendorId;
        const productId = deviceInfo.productId;

        // Known IDs (you'll need to confirm these)
        const RAK_VENDOR_ID = 0x0483; // STMicroelectronics (common for RAK)
        const RAK_PRODUCT_ID = 0x5740; // Example, check your actual device

        const RADAR_VENDOR_ID = 0x10C4; // Silicon Labs (common for CP210x)
        const RADAR_PRODUCT_ID = 0xEA60; // Example

        // Identify device type
        if (vendorId === RAK_VENDOR_ID && productId === RAK_PRODUCT_ID) {
            return { type: 'RAK_NODE', port };
        } else if (vendorId === RADAR_VENDOR_ID && productId === RADAR_PRODUCT_ID) {
            return { type: 'RADAR_DONGLE', port };
        } else if (deviceInfo.productName?.includes('Power')) {
            return { type: 'POWER_INPUT', port };
        } else {
            return { type: 'UNKNOWN', port };
        }
    }

    // Assign devices to the correct handlers
    async assignDevices(ports) {
        const assignments = [];

        for (const port of ports) {
            const detected = await this.detectDevice(port);
            assignments.push(detected);

            if (detected.type === 'RAK_NODE') {
                this.devices.rakNode = port;
                // Initialize MeshHardwareNode with this port
                const meshNode = new MeshHardwareNode();
                meshNode.port = port;
                await meshNode.start();
            } else if (detected.type === 'RADAR_DONGLE') {
                this.devices.radarDongle = port;
                // Initialize RadarReader with this port
                const radar = new RadarReader();
                radar.port = port;
                await radar.start();
            }
        }

        return assignments;
    }
}