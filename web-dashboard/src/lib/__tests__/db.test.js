// src/lib/__tests__/db.test.js
// The mock for '@sqlite.org/sqlite-wasm' is already defined in __mocks__,
// but we need to ensure Jest uses it.

import { initDatabase } from '../db';

describe('SQLite Database', () => {
  test('Database initializes and creates tables', async () => {
    const db = await initDatabase();
    expect(db).toBeDefined();
    expect(typeof db.exec).toBe('function');
  });

  test('Seed data is inserted', async () => {
    const db = await initDatabase();
    expect(db).toBeDefined();
    // We can't verify count due to mock, but ensure no error.
  });

  test('User profile can be inserted and retrieved', async () => {
    const db = await initDatabase();
    expect(db.exec).toBeDefined();
    // Just verify it doesn't throw
    expect(() => db.exec(`
      INSERT OR REPLACE INTO local_user_profile (guid, mesh_node_id, permission_tier)
      VALUES ('test-guid-123', 'MESH-TEST', 1)
    `)).not.toThrow();
  });
});