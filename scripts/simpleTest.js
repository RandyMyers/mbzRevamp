console.log('🔧 [SIMPLE TEST] Starting simple test...');

// Test if we can require the models
try {
  const Organization = require('../models/organization');
  console.log('✅ [SIMPLE TEST] Organization model loaded');
} catch (error) {
  console.error('❌ [SIMPLE TEST] Error loading Organization model:', error.message);
}

try {
  const templateMergerService = require('../services/templateMergerService');
  console.log('✅ [SIMPLE TEST] Template merger service loaded');
  console.log('Available functions:', Object.keys(templateMergerService));
} catch (error) {
  console.error('❌ [SIMPLE TEST] Error loading template merger service:', error.message);
}

console.log('✅ [SIMPLE TEST] Simple test completed!');
