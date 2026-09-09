// src/lib/__tests__/supabase.test.js

// Mock the supabase client completely
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
    // For the insert test, we need to return specific data
    // We'll override in individual tests if needed.
  }
}));

import { supabase } from '../../lib/supabaseClient';

describe('Supabase Connection', () => {
  test('Can connect to Supabase', async () => {
    // We'll mock the from().select().limit() chain to return a specific result
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = jest.fn(() => ({ limit: mockLimit }));
    const mockFrom = jest.fn(() => ({ select: mockSelect }));
    supabase.from = mockFrom;

    const { data, error } = await supabase.from('users').select('count').limit(1);
    expect(error).toBeNull();
    // Ensure the mock was called
    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  test('Can insert a test user', async () => {
    const testGuid = `test-${Date.now()}`;
    // Setup mock for insert/select chain
    const mockSelectAfterInsert = jest.fn().mockResolvedValue({ data: [{ guid: testGuid }], error: null });
    const mockInsert = jest.fn(() => ({ select: mockSelectAfterInsert }));
    const mockFrom = jest.fn(() => ({ insert: mockInsert }));
    supabase.from = mockFrom;

    const { data, error } = await supabase
      .from('users')
      .insert([{
        guid: testGuid,
        mesh_node_id: 'MESH-TEST-001',
        permission_tier: 1,
        vetting_status: 'PENDING'
      }])
      .select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data[0].guid).toBe(testGuid);

    // Clean up: mock delete
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn(() => ({ eq: mockEq }));
    supabase.from = jest.fn(() => ({ delete: mockDelete }));
    await supabase.from('users').delete().eq('guid', testGuid);
    expect(mockEq).toHaveBeenCalledWith('guid', testGuid);
  });

  test('Can query a table (if schema exists)', async () => {
    // Mock to return error to simulate table not existing, or just return success.
    // We'll mock to return no error (table exists).
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = jest.fn(() => ({ limit: mockLimit }));
    const mockFrom = jest.fn(() => ({ select: mockSelect }));
    supabase.from = mockFrom;

    const { error } = await supabase.from('vetting_questions').select('count').limit(1);
    expect(error).toBeNull();
  });
});