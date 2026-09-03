import { NodeInterface } from './NodeInterface';
import { supabase } from '../lib/supabaseClient'; // Your existing supabase client

export class MeshSimulatedNode extends NodeInterface {
    constructor(userId, channelId) {
        super();
        this.userId = userId;
        this.channelId = channelId; // The "Room" or "Mesh" ID
    }

    async start() {
        // Start watching GPS
        this.watchId = navigator.geolocation.watchPosition(
            pos => this.updatePosition(pos),
            err => console.error(err),
            { enableHighAccuracy: true }
        );
    }

    async updatePosition(position) {
        const payload = {
            id: this.userId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading
        };
        // Broadcast "as if BLE" via Supabase Realtime channel
        await supabase.channel(this.channelId).send({
            type: 'broadcast',
            event: 'node_update',
            payload
        });
    }

    async getPosition() { /* Return last known GPS */ }

    async sendAlert(payload) {
        // Push alarm to Supabase table (utilizing your existing setup)
        await supabase.from('alerts').insert([{ ...payload, type: 'SIMULATION' }]);
    }

    async stop() { navigator.geolocation.clearWatch(this.watchId); }
}