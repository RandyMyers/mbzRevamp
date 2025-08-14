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
