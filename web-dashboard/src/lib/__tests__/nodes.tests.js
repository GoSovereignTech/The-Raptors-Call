// web-dashboard/src/components/__tests__/nodes.test.js
import { MeshSimulatedNode } from '../MeshSimulatedNode';
import { FallbackNode } from '../FallbackNode';
import { NodeInterface } from '../NodeInterface';

// Mock Supabase
jest.mock('../../lib/supabaseClient', () => ({
    supabase: {
        channel: jest.fn(() => ({
            send: jest.fn(),
            subscribe: jest.fn(),
        })),
        from: jest.fn(() => ({
            insert: jest.fn()
        }))
    }
}));

describe('Safety Node Classes', () => {
    test('NodeInterface enforces implementation', () => {
        expect(() => new NodeInterface()).toThrow(TypeError);
    });

    test('FallbackNode returns the phone GPS position', async () => {
        const node = new FallbackNode();
        // Mocking geolocation
        global.navigator.geolocation = {
            watchPosition: (success) => success({ coords: { latitude: 40.7, longitude: -74.0 } })
        };
        await node.start();
        const pos = await node.getPosition();
        expect(pos.lat).toBe(40.7);
    });

    test('MeshSimulatedNode sends alerts to Supabase with SIMULATION flag', async () => {
        const node = new MeshSimulatedNode('user_123', 'channel_1');
        const spy = jest.spyOn(node, 'sendAlert');
        await node.sendAlert({ alarm: true });
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'SIMULATION' }));
    });
});