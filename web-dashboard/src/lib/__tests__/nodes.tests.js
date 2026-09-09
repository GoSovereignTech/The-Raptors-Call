// src/lib/__tests__/nodes.tests.js
import { MeshSimulatedNode } from '../../components/MeshSimulatedNode';
import { FallbackNode } from '../../components/FallbackNode';
import { NodeInterface } from '../../components/NodeInterface';

// Mock Supabase - create the mock function inside the factory
jest.mock('../../lib/supabaseClient', () => {
  const insertMock = jest.fn();
  return {
    supabase: {
      channel: jest.fn(() => ({
        send: jest.fn(),
        subscribe: jest.fn(),
      })),
      from: jest.fn(() => ({
        insert: insertMock
      }))
    },
    // Expose insertMock for testing
    __insertMock: insertMock
  };
});

// Import the mock to use in the test
import { __insertMock as insertMock } from '../../lib/supabaseClient';

describe('Safety Node Classes', () => {
  test('NodeInterface enforces implementation', () => {
    expect(() => new NodeInterface()).toThrow(TypeError);
  });

  test('FallbackNode returns the phone GPS position', async () => {
    const node = new FallbackNode();
    // Mock geolocation
    global.navigator.geolocation = {
      watchPosition: (success) => success({ coords: { latitude: 40.7, longitude: -74.0 } })
    };
    await node.start();
    const pos = await node.getPosition();
    expect(pos.lat).toBe(40.7);
  });

  test('MeshSimulatedNode sends alerts to Supabase with SIMULATION flag', async () => {
    const node = new MeshSimulatedNode('user_123', 'channel_1');
    // Clear any previous calls
    insertMock.mockClear();
    await node.sendAlert({ alarm: true });
    expect(insertMock).toHaveBeenCalledWith([{ alarm: true, type: 'SIMULATION' }]);
  });
});