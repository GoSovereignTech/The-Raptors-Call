// meshtasticPacket.js
const NODE_TYPES = {
    RELAY: 'relay',
    TRIPLE_SENSOR: 'triple_sensor',
    TAG: 'tag',
    UNKNOWN: 'unknown'
};

// Example packet structure
const packet = {
    node_id: 'MESH-ABC123',
    node_type: NODE_TYPES.TAG, // <-- New field
    lat: 32.456,
    lon: -85.123,
    timestamp: Date.now(),
    rssi: -85,
    is_emergency: false
};