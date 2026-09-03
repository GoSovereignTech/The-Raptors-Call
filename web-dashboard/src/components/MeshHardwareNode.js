import { NodeInterface } from './NodeInterface';

export class MeshHardwareNode extends NodeInterface {
    constructor() {
        super();
        this.port = null;
    }

    async start() {
        // Request access to the USB Port (Web Serial API)
        this.port = await navigator.serial.requestPort();
        await this.port.open({ baudRate: 115200 });
        // Setup reading loop
        this.reader = this.port.readable.getReader();
        this.readLoop();
    }

    async readLoop() {
        while (true) {
            const { value, done } = await this.reader.read();
            if (done) break;
            // Parse RakWireless Meshtastic Payload
            const payload = JSON.parse(new TextDecoder().decode(value));
            this.processNode(payload);
        }
    }

    async getPosition() { /* Parse GPS from Meshtastic payload */ }

    async sendAlert(payload) {
        // Write to serial port
        this.port.writable.getWriter().write(new TextEncoder().encode(JSON.stringify(payload)));
    }

    async stop() { await this.port.close(); }
}