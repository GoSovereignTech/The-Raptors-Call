import { NodeInterface } from './NodeInterface';

export class FallbackNode extends NodeInterface {
    constructor() {
        super();
        this.position = { lat: 0, lng: 0 };
    }

    async start() {
        navigator.geolocation.watchPosition(pos => {
            this.position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        });
    }

    async getPosition() { return this.position; }

    async sendAlert(payload) {
        // Just log to console since there is no network
        console.log("ALERT (No Network):", payload);
    }

    async stop() { /* clear watch */ }
}