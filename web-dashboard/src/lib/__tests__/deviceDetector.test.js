// lib/__tests__/deviceDetector.test.js

import { DeviceDetector } from './../deviceDetector.js';

describe('Device Detector', () => {
    let detector;

    beforeEach(() => {
        detector = new DeviceDetector();
    });

    test('Detector initializes in simulation mode by default', () => {
        expect(detector.simulationMode).toBe(true);
        expect(detector.getMode()).toBe('simulation');
    });

    test('Detector returns status summary', () => {
        const status = detector.getStatus();
        expect(status.mode).toBe('simulation');
        expect(status.rakNode).toBe(false);
        expect(status.radarDongle).toBe(false);
        expect(status.totalDevices).toBe(0);
    });

    test('Detector can identify device types', async () => {
        // Mock port
        const mockPort = {
            getInfo: async () => ({
                vendorId: 0x0483,
                productId: 0x5740,
                productName: 'RAK Wireless Node'
            })
        };

        const result = await detector.identifyDevice(mockPort);
        expect(result.type).toBe('RAK_NODE');
    });

    test('Detector handles unknown devices', async () => {
        const mockPort = {
            getInfo: async () => ({
                vendorId: 0x1234,
                productId: 0x5678,
                productName: 'Unknown Device'
            })
        };

        const result = await detector.identifyDevice(mockPort);
        expect(result.type).toBe('UNKNOWN');
    });
});