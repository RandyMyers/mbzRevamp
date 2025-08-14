const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MBZ Tech Platform API',
      version: '1.0.0',
      description: 'Complete API documentation for MBZ Tech Platform - E-commerce Management System',
      contact: {
        name: 'MBZ Tech Support',
        email: 'support@mbztech.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://mbzrevamp.onrender.com/api',
        description: 'Production server'
      },
      {
        url: 'http://localhost:8800/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      },
      schemas: {
        // Task Schema
        Task: {
          type: 'object',
          required: ['title', 'description', 'organization', 'createdBy'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Task ID'
            },
            title: {
              type: 'string',
              description: 'Task title',
              example: 'Complete project setup'
            },
            description: {
              type: 'string',
              description: 'Task description',
              example: 'Set up the development environment'
            },
            status: {
              type: 'string',
              enum: ['pending', 'inProgress', 'review', 'completed', 'cancelled', 'onHold'],
              default: 'pending',
              description: 'Task status'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              default: 'medium',
              description: 'Task priority'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date'
            },
            assignedTo: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: 'Array of user IDs assigned to the task'
            },
            organization: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID'
            },
            createdBy: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID who created the task'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Task tags'
            },
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              default: 0,
              description: 'Task progress percentage'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        // User Schema
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              description: 'User password (min 6 characters)',
              minLength: 6
            },
            username: {
              type: 'string',
              description: 'Username (optional)'
            },
            role: {
              type: 'string',
              format: 'ObjectId',
              description: 'Role ID reference'
            },
            organization: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID reference'
            },
            department: {
              type: 'string',
              enum: ['Customer Support', 'IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Billing', 'Shipping'],
              description: 'User department'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              default: 'active'
            },
            profilePicture: {
              type: 'string',
              description: 'Profile picture URL'
            }
          }
        },
        // Store Schema
        Store: {
          type: 'object',
          required: ['name', 'url', 'platformType', 'apiKey', 'secretKey', 'organizationId'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            name: {
              type: 'string',
              description: 'Store name',
              example: 'My Online Store'
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Store website URL',
              example: 'https://mystore.com'
            },
            platformType: {
              type: 'string',
              enum: ['woocommerce', 'shopify', 'magento', 'bigcommerce', 'custom'],
              description: 'E-commerce platform type'
            },
            apiKey: {
              type: 'string',
              description: 'Platform API key'
            },
            secretKey: {
              type: 'string',
              description: 'Platform secret key'
            },
            description: {
              type: 'string',
              description: 'Store description'
            },
            websiteLogo: {
              type: 'string',
              description: 'Store logo URL'
            },
            organizationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID'
            },
            isActive: {
              type: 'boolean',
              default: true
            }
          }
        },
        // Product Schema
        Product: {
          type: 'object',
          required: ['storeId', 'name', 'slug', 'sku', 'regular_price', 'type', 'userId', 'organizationId'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            storeId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Store ID reference'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            slug: {
              type: 'string',
              description: 'Product URL slug'
            },
            type: {
              type: 'string',
              default: 'simple',
              description: 'Product type'
            },
            status: {
              type: 'string',
              default: 'publish',
              description: 'Product status'
            },
            sku: {
              type: 'string',
              description: 'Stock keeping unit'
            },
            price: {
              type: 'string',
              description: 'Current price'
            },
            regular_price: {
              type: 'string',
              description: 'Regular price (required)'
            },
            sale_price: {
              type: 'string',
              description: 'Sale price'
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            short_description: {
              type: 'string',
              description: 'Short product description'
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'name', 'slug'],
                properties: {
                  id: {
                    type: 'number',
                    description: 'Category ID'
                  },
                  name: {
                    type: 'string',
                    description: 'Category name'
                  },
                  slug: {
                    type: 'string',
                    description: 'Category slug'
                  }
                }
              }
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'date_created', 'src'],
                properties: {
                  id: {
                    type: 'number',
                    description: 'Image ID'
                  },
                  date_created: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Image creation date'
                  },
                  src: {
                    type: 'string',
                    description: 'Image URL'
                  },
                  alt: {
                    type: 'string',
                    description: 'Image alt text'
                  }
                }
              }
            },
            userId: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID who created the product'
            },
            organizationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID'
            }
          }
        },
        // Webhook Schema
        Webhook: {
          type: 'object',
          required: ['storeId', 'organizationId', 'wooCommerceId', 'webhookIdentifier', 'name', 'topic', 'deliveryUrl', 'secret'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Webhook ID'
            },
            storeId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Store ID'
            },
            organizationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID'
            },
            wooCommerceId: {
              type: 'number',
              description: 'WooCommerce webhook ID'
            },
            webhookIdentifier: {
              type: 'string',
              description: 'Unique webhook identifier'
            },
            name: {
              type: 'string',
              description: 'Webhook name'
            },
            topic: {
              type: 'string',
              enum: ['order.created', 'order.updated', 'order.deleted', 'customer.created', 'customer.updated', 'customer.deleted', 'product.created', 'product.updated', 'product.deleted'],
              description: 'Webhook topic'
            },
            status: {
              type: 'string',
              enum: ['active', 'paused', 'disabled'],
              default: 'active',
              description: 'Webhook status'
            },
            deliveryUrl: {
              type: 'string',
              description: 'Webhook delivery URL'
            },
            secret: {
              type: 'string',
              description: 'Webhook secret for signature verification'
            },
            resource: {
              type: 'string',
              enum: ['order', 'customer', 'product'],
              description: 'Resource type'
            },
            event: {
              type: 'string',
              enum: ['created', 'updated', 'deleted'],
              description: 'Event type'
            },
            hooks: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of hook types'
            },
            failureCount: {
              type: 'number',
              default: 0,
              description: 'Number of delivery failures'
            },
            lastDelivery: {
              type: 'string',
              format: 'date-time',
              description: 'Last successful delivery timestamp'
            },
            lastFailure: {
              type: 'string',
              format: 'date-time',
              description: 'Last failure timestamp'
            },
            lastFailureReason: {
              type: 'string',
              description: 'Reason for last failure'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Webhook creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Webhook last update timestamp'
            }
          }
        },
        // Customer Schema
        Customer: {
          type: 'object',
          required: ['name', 'email', 'storeId', 'organizationId'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Customer ID'
            },
            name: {
              type: 'string',
              description: 'Customer full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Customer email address'
            },
            phone: {
              type: 'string',
              description: 'Customer phone number'
            },
            address: {
              type: 'object',
              description: 'Customer address information'
            },
            storeId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Store ID where customer belongs'
            },
            organizationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID'
            },
            customer_id: {
              type: 'string',
              description: 'External customer ID (e.g., WooCommerce)'
            },
            avatar: {
              type: 'string',
              description: 'Customer avatar URL'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'blocked'],
              default: 'active',
              description: 'Customer status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Customer creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Customer last update timestamp'
            }
          }
        },
        // Order Schema
        Order: {
          type: 'object',
          required: ['storeId', 'userId', 'organizationId', 'billing', 'shipping', 'line_items', 'total'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Order ID'
            },
            storeId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Store ID where order belongs'
            },
            userId: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID who created the order'
            },
            organizationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID'
            },
            customer_id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Customer ID (optional)'
            },
            billing: {
              type: 'object',
              required: ['first_name', 'last_name', 'email'],
              properties: {
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                company: { type: 'string', example: 'ACME Corp' },
                address_1: { type: 'string', example: '123 Main St' },
                address_2: { type: 'string', example: 'Apt 4B' },
                city: { type: 'string', example: 'New York' },
                state: { type: 'string', example: 'NY' },
                postcode: { type: 'string', example: '10001' },
                country: { type: 'string', example: 'US' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                phone: { type: 'string', example: '+1-555-123-4567' }
              }
            },
            shipping: {
              type: 'object',
              required: ['first_name', 'last_name'],
              properties: {
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                company: { type: 'string', example: 'ACME Corp' },
                address_1: { type: 'string', example: '123 Main St' },
                address_2: { type: 'string', example: 'Apt 4B' },
                city: { type: 'string', example: 'New York' },
                state: { type: 'string', example: 'NY' },
                postcode: { type: 'string', example: '10001' },
                country: { type: 'string', example: 'US' }
              }
            },
            line_items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'quantity', 'unit_price'],
                properties: {
                  product_id: { type: 'string', description: 'Product ID' },
                  name: { type: 'string', description: 'Product name' },
                  quantity: { type: 'number', description: 'Product quantity' },
                  unit_price: { type: 'string', description: 'Line item total' },
                  total: { type: 'string', description: 'Line item subtotal' }
                }
              }
            },
            total: {
              type: 'string',
              description: 'Order total amount'
            },
            currency: {
              type: 'string',
              description: 'Order currency'
            },
            status: {
              type: 'string',
              description: 'Order status'
            },
            payment_method: {
              type: 'string',
              description: 'Payment method'
            },
            syncToWooCommerce: {
              type: 'boolean',
              description: 'Whether to sync order to WooCommerce'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order last update timestamp'
            }
          }
        },
        // Invoice Schema
        Invoice: {
          type: 'object',
          required: ['customerId', 'storeId', 'organizationId', 'userId', 'customerName', 'customerEmail', 'items', 'totalAmount'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Unique invoice ID'
            },
            customerId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Customer ID'
            },
            storeId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Store ID'
            },
            organizationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID'
            },
            userId: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID who created the invoice'
            },
            customerName: {
              type: 'string',
              description: 'Customer name'
            },
            customerEmail: {
              type: 'string',
              format: 'email',
              description: 'Customer email'
            },
            customerAddress: {
              type: 'object',
              description: 'Customer address'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'quantity', 'unitPrice'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Item name'
                  },
                  quantity: {
                    type: 'number',
                    description: 'Item quantity'
                  },
                  unitPrice: {
                    type: 'number',
                    description: 'Item unit price'
                  },
                  total: {
                    type: 'number',
                    description: 'Item total price'
                  }
                }
              }
            },
            subtotal: {
              type: 'number',
              description: 'Subtotal amount'
            },
            taxAmount: {
              type: 'number',
              description: 'Tax amount'
            },
            discountAmount: {
              type: 'number',
              description: 'Discount amount'
            },
            totalAmount: {
              type: 'number',
              description: 'Total amount'
            },
            currency: {
              type: 'string',
              enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'NGN'],
              description: 'Currency code'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Invoice due date'
            },
            notes: {
              type: 'string',
              description: 'Additional notes'
            },
            terms: {
              type: 'string',
              description: 'Invoice terms'
            },
            type: {
              type: 'string',
              description: 'Invoice type'
            },
            templateId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Invoice template ID'
            },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
              description: 'Invoice status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Invoice creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Invoice last update timestamp'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Tasks',
        description: 'Task management operations'
      },
      {
        name: 'Stores',
        description: 'Store management operations'
      },
      {
        name: 'Products',
        description: 'Product inventory operations'
      },
      {
        name: 'Orders',
        description: 'Order management operations'
      },
      {
        name: 'Customers',
        description: 'Customer management operations'
      },
      {
        name: 'Webhooks',
        description: 'Webhook management operations'
      },
      {
        name: 'Invoices',
        description: 'Invoice management operations'
      },
      {
        name: 'Campaigns',
        description: 'Campaign management operations'
      },
      {
        name: 'Emails',
        description: 'Email management operations'
      },
      {
        name: 'Notifications',
        description: 'Notification management operations'
      },
      {
        name: 'Feedback',
        description: 'Feedback management operations'
      },
      {
        name: 'Invitations',
        description: 'Invitation management operations'
      },
      {
        name: 'Receipts',
        description: 'Receipt management operations'
      },
      {
        name: 'Shipping',
        description: 'Shipping label management operations'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting operations'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
