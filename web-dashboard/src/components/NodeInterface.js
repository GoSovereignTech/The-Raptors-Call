export class NodeInterface {
    constructor() {
        if (new.target === NodeInterface) {
            throw new TypeError("Cannot construct NodeInterface instances directly");
        }
    }
    async start() { throw new Error("Method 'start()' must be implemented."); }
    async stop() { throw new Error("Method 'stop()' must be implemented."); }
    async getPosition() { throw new Error("Method 'getPosition()' must be implemented."); }
    async sendAlert(payload) { throw new Error("Method 'sendAlert()' must be implemented."); }
}