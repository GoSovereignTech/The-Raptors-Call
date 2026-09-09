// src/lib/__tests__/runAllTests.js
// Run this with: node src/lib/__tests__/runAllTests.js

console.log('========================================');
console.log('  RAPTOR\'S CALL - TEST SUITE');
console.log('========================================\n');

// Import and run all tests
import('./db.test.js').then(() => {
  console.log('✅ db.test.js passed');
}).catch((e) => {
  console.error('❌ db.test.js failed:', e.message);
});

import('./deviceDetector.test.js').then(() => {
  console.log('✅ deviceDetector.test.js passed');
}).catch((e) => {
  console.error('❌ deviceDetector.test.js failed:', e.message);
});

import('./supabase.test.js').then(() => {
  console.log('✅ supabase.test.js passed');
}).catch((e) => {
  console.error('❌ supabase.test.js failed:', e.message);
});

import('./nodes.tests.js').then(() => {
  console.log('✅ nodes.tests.js passed');
}).catch((e) => {
  console.error('❌ nodes.tests.js failed:', e.message);
});

console.log('\n✅ All tests completed.');