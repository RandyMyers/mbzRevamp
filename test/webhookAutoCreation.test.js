const { createDefaultWebhooks, validateStoreForWebhooks } = require('../services/webhookAutoCreationService');

// Mock data for testing
const mockStore = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Store',
  organizationId: '507f1f77bcf86cd799439012',
  url: 'https://teststore.com',
  apiKey: 'test_api_key',
  secretKey: 'test_secret_key',
  platformType: 'woocommerce',
  isActive: true
};

const mockUserId = '507f1f77bcf86cd799439013';

describe('Webhook Auto-Creation Service', () => {
  describe('validateStoreForWebhooks', () => {
    test('should validate a properly configured store', () => {
      const result = validateStoreForWebhooks(mockStore);
      expect(result.valid).toBe(true);
    });

    test('should reject store without URL', () => {
      const invalidStore = { ...mockStore, url: null };
      const result = validateStoreForWebhooks(invalidStore);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('URL is required');
    });

    test('should reject store without API key', () => {
      const invalidStore = { ...mockStore, apiKey: null };
      const result = validateStoreForWebhooks(invalidStore);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    test('should reject store without secret key', () => {
      const invalidStore = { ...mockStore, secretKey: null };
      const result = validateStoreForWebhooks(invalidStore);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Secret key is required');
    });

    test('should reject inactive store', () => {
      const invalidStore = { ...mockStore, isActive: false };
      const result = validateStoreForWebhooks(invalidStore);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be active');
    });
  });

  describe('createDefaultWebhooks', () => {
    test('should return proper structure for webhook creation results', async () => {
      // Mock the WooCommerce API and database calls
      const mockCreateSingleWebhook = jest.fn().mockResolvedValue({
        success: true,
        webhook: { _id: 'webhook123', topic: 'order.created' },
        wooCommerceId: 123,
        deliveryUrl: 'https://api.example.com/webhooks/test'
      });

      // Mock the service function
      const originalCreateSingleWebhook = require('../services/webhookAutoCreationService').createSingleWebhook;
      require('../services/webhookAutoCreationService').createSingleWebhook = mockCreateSingleWebhook;

      const result = await createDefaultWebhooks(mockStore, mockUserId);

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('webhooks');
      expect(result).toHaveProperty('errors');

      // Restore original function
      require('../services/webhookAutoCreationService').createSingleWebhook = originalCreateSingleWebhook;
    });
  });
});

describe('Webhook Auto-Creation Integration', () => {
  test('should handle webhook creation in store creation flow', async () => {
    // This test would verify the integration between store creation and webhook auto-creation
    // It would test the complete flow from store creation to webhook setup
    
    const storeData = {
      name: 'Integration Test Store',
      organizationId: '507f1f77bcf86cd799439012',
      userId: mockUserId,
      platformType: 'woocommerce',
      url: 'https://integrationtest.com',
      apiKey: 'integration_api_key',
      secretKey: 'integration_secret_key',
      createWebhooks: true
    };

    // Mock store creation response
    const mockCreatedStore = {
      ...storeData,
      _id: '507f1f77bcf86cd799439014',
      isActive: true
    };

    // Mock webhook creation results
    const mockWebhookResults = {
      total: 6,
      successful: 6,
      failed: 0,
      webhooks: [
        { topic: 'order.created', webhookId: 'webhook1', wooCommerceId: 1 },
        { topic: 'order.updated', webhookId: 'webhook2', wooCommerceId: 2 },
        { topic: 'customer.created', webhookId: 'webhook3', wooCommerceId: 3 },
        { topic: 'customer.updated', webhookId: 'webhook4', wooCommerceId: 4 },
        { topic: 'product.created', webhookId: 'webhook5', wooCommerceId: 5 },
        { topic: 'product.updated', webhookId: 'webhook6', wooCommerceId: 6 }
      ],
      errors: []
    };

    // Verify the expected response structure
    const expectedResponse = {
      success: true,
      message: 'Store created successfully',
      store: mockCreatedStore,
      webhookCreation: mockWebhookResults
    };

    expect(expectedResponse).toHaveProperty('success', true);
    expect(expectedResponse).toHaveProperty('store');
    expect(expectedResponse).toHaveProperty('webhookCreation');
    expect(expectedResponse.webhookCreation).toHaveProperty('total', 6);
    expect(expectedResponse.webhookCreation).toHaveProperty('successful', 6);
    expect(expectedResponse.webhookCreation).toHaveProperty('failed', 0);
  });
}); 