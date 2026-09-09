// localActiveNodes.js
// Runs on the hardened phone (Google Pixel)

export class ActiveNodeTracker {
    constructor() {
        this.activeNodes = new Map(); // node_id -> { last_seen, gps, type, is_friend }
        this.FRIEND_LIST = []; // Loaded from local cache (GUIDs of trusted nodes)
        this.EXPIRY_MS = 300000; // 5 minutes
    }

    // Called when a LoRa packet is received
    processPacket(packet) {
        const nodeId = packet.node_id;
        const nodeType = packet.node_type || 'unknown';
        const isFriend = this.FRIEND_LIST.includes(nodeId);

        this.activeNodes.set(nodeId, {
            last_seen: Date.now(),
            gps: { lat: packet.lat, lon: packet.lon },
            nodeType: nodeType,
            isFriend: isFriend,
            rssi: packet.rssi
        });

        // Remove expired nodes
        this.cleanup();
    }

    cleanup() {
        const now = Date.now();
        for (const [id, data] of this.activeNodes) {
            if (now - data.last_seen > this.EXPIRY_MS) {
                this.activeNodes.delete(id);
            }
        }
    }

    // Return counts for UI
    getStats() {
        const total = this.activeNodes.size;
        const friends = Array.from(this.activeNodes.values())
            .filter(n => n.isFriend).length;
        const relays = Array.from(this.activeNodes.values())
            .filter(n => n.nodeType === 'relay').length;
        const sensors = Array.from(this.activeNodes.values())
            .filter(n => n.nodeType === 'triple_sensor').length;
        const tags = Array.from(this.activeNodes.values())
            .filter(n => n.nodeType === 'tag').length;

        return { total, friends, relays, sensors, tags };
    }

    // Get node positions for map
    getNodePositions() {
        return Array.from(this.activeNodes.entries()).map(([id, data]) => ({
            id,
            lat: data.gps.lat,
            lon: data.gps.lon,
            type: data.nodeType,
            isFriend: data.isFriend,
            rssi: data.rssi
        }));
    }
}