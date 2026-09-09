// lib/deviceDetector.js
// Full device detection for USB-C hub with multiple devices

export class DeviceDetector {
    constructor() {
        this.devices = {
            rakNode: null,
            radarDongle: null,
            power: null,
            unknown: []
        };
        this.simulationMode = true;
        this.listeners = [];
        this.ports = [];
    }

    // Event listener for device changes
    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    // Detect all connected USB devices
    async detectAll() {
        try {
            // Check if Web Serial API is available
            if (!navigator.serial) {
                console.warn('Web Serial API not available. Running in simulation mode.');
                this.simulationMode = true;
                return { mode: 'simulation', devices: this.devices };
            }

            // Get available ports
            const ports = await navigator.serial.getPorts();
            this.ports = ports;

            if (ports.length === 0) {
                console.log('No USB devices detected. Running in simulation mode.');
                this.simulationMode = true;
                return { mode: 'simulation', devices: this.devices };
            }

            // Identify each device
            for (const port of ports) {
                const info = await this.identifyDevice(port);
                if (info.type === 'RAK_NODE') {
                    this.devices.rakNode = { port, info };
                } else if (info.type === 'RADAR_DONGLE') {
                    this.devices.radarDongle = { port, info };
                } else if (info.type === 'POWER_INPUT') {
                    this.devices.power = { port, info };
                } else {
                    this.devices.unknown.push({ port, info });
                }
            }

            // Determine mode
            this.simulationMode = !this.devices.rakNode && !this.devices.radarDongle;
            
            this.notifyListeners({
                type: 'deviceDetected',
                devices: this.devices,
                mode: this.simulationMode ? 'simulation' : 'live'
            });

            return {
                mode: this.simulationMode ? 'simulation' : 'live',
                devices: this.devices
            };

        } catch (error) {
            console.error('Device detection error:', error);
            this.simulationMode = true;
            return { mode: 'simulation', devices: this.devices, error: error.message };
        }
    }

    // Identify a single device by vendor/product ID
    async identifyDevice(port) {
        try {
            const info = await port.getInfo();
            
            // Known vendor/product IDs
            // RAK Wireless (STMicroelectronics or Silicon Labs)
            const RAK_VENDOR_IDS = [0x0483, 0x10C4, 0x1A86];
            const RAK_PRODUCT_IDS = [0x5740, 0xEA60, 0x7523];
            
            // Radar dongle (common CP210x or CH340)
            const RADAR_VENDOR_IDS = [0x10C4, 0x1A86, 0x0403];
            const RADAR_PRODUCT_IDS = [0xEA60, 0x7523, 0x6001];
            
            const vendorId = info.vendorId || info.usbVendorId;
            const productId = info.productId || info.usbProductId;
            const productName = info.productName || info.manufacturer || '';

            // Check for RAK Node
            if (RAK_VENDOR_IDS.includes(vendorId) && RAK_PRODUCT_IDS.includes(productId)) {
                return { type: 'RAK_NODE', vendorId, productId, productName };
            }

            // Check for Radar Dongle
            if (RADAR_VENDOR_IDS.includes(vendorId) && RADAR_PRODUCT_IDS.includes(productId)) {
                return { type: 'RADAR_DONGLE', vendorId, productId, productName };
            }

            // Check for power input (USB PD)
            if (productName.toLowerCase().includes('power') || 
                productName.toLowerCase().includes('charge') ||
                productName.toLowerCase().includes('hub')) {
                return { type: 'POWER_INPUT', vendorId, productId, productName };
            }

            // Unknown
            return { type: 'UNKNOWN', vendorId, productId, productName };

        } catch (error) {
            console.error('Error identifying device:', error);
            return { type: 'UNKNOWN', error: error.message };
        }
    }

    // Get the current mode (simulation or live)
    getMode() {
        return this.simulationMode ? 'simulation' : 'live';
    }

    // Check if a specific device type is connected
    hasDevice(type) {
        return !!this.devices[type];
    }

    // Get device info for a specific type
    getDevice(type) {
        return this.devices[type] || null;
    }

    // Get status summary
    getStatus() {
        const status = {
            mode: this.simulationMode ? 'simulation' : 'live',
            rakNode: !!this.devices.rakNode,
            radarDongle: !!this.devices.radarDongle,
            power: !!this.devices.power,
            unknownCount: this.devices.unknown.length,
            totalDevices: Object.values(this.devices).filter(d => d).length + this.devices.unknown.length - 1 // -1 for unknown array
        };
        return status;
    }
}

// Singleton instance
let detectorInstance = null;

export function getDeviceDetector() {
    if (!detectorInstance) {
        detectorInstance = new DeviceDetector();
    }
    return detectorInstance;
}