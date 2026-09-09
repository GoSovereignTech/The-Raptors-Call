// Routing different data streams

class DataRouter {
    constructor() {
        this.rakData = null;
        this.radarData = null;
    }

    // Called when data arrives from any USB device
    routeData(sourceType, data) {
        if (sourceType === 'RAK_NODE') {
            this.handleRakData(data);
        } else if (sourceType === 'RADAR_DONGLE') {
            this.handleRadarData(data);
        }
    }

    handleRakData(data) {
        try {
            const packet = JSON.parse(data);
            // Update mesh state
            this.rakData = packet;
            // Broadcast to UI
            window.dispatchEvent(new CustomEvent('meshUpdate', { detail: packet }));
        } catch (e) {
            console.warn('Invalid RAK packet:', e);
        }
    }

    handleRadarData(data) {
        try {
            // Parse radar data
            const radarPacket = this.parseRadarFrame(data);
            this.radarData = radarPacket;
            // Broadcast to UI
            window.dispatchEvent(new CustomEvent('radarUpdate', { detail: radarPacket }));
        } catch (e) {
            console.warn('Invalid radar packet:', e);
        }
    }

    parseRadarFrame(rawData) {
        // HLK-LD2450 protocol: 30-byte frames
        if (rawData.length < 30) return null;
        const frame = new Uint8Array(rawData);
        // Byte 0-1: Frame header
        // Byte 2: Target count
        // Bytes 3-29: 3 targets x 8 bytes
        // ... parsing logic
        return { targets: [] }; // Simplified
    }
}