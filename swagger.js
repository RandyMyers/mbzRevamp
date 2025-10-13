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
      }
    },
    servers: [
      {
        url: 'https://api.elapix.store',
        description: 'Production server (Digital Ocean)'
      },
      {
        url: 'http://localhost:3000',
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
            attachments: {
              type: 'array',
              description: 'Array of task attachments',
              items: {
                type: 'object',
                properties: {
                  _id: {
                    type: 'string',
                    format: 'ObjectId',
                    description: 'Attachment ID'
                  },
                  filename: {
                    type: 'string',
                    description: 'Original filename',
                    example: 'document.pdf'
                  },
                  url: {
                    type: 'string',
                    description: 'File URL or path',
                    example: '/uploads/tasks/1234567890_abc123.pdf'
                  },
                  storageType: {
                    type: 'string',
                    enum: ['cloudinary', 'local'],
                    description: 'Storage location type'
                  },
                  publicId: {
                    type: 'string',
                    description: 'Cloudinary public ID (for cloudinary storage)'
                  },
                  path: {
                    type: 'string',
                    description: 'Local file path (for local storage)'
                  },
                  format: {
                    type: 'string',
                    description: 'File format/extension',
                    example: 'pdf'
                  },
                  size: {
                    type: 'number',
                    description: 'File size in bytes',
                    example: 2048576
                  },
                  category: {
                    type: 'string',
                    enum: ['IMAGES', 'DOCUMENTS', 'ARCHIVES', 'MEDIA', 'UNKNOWN'],
                    description: 'File category'
                  },
                  uploadedBy: {
                    type: 'string',
                    format: 'ObjectId',
                    description: 'User ID who uploaded the file'
                  },
                  uploadedAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Upload timestamp'
                  }
                }
              }
            },
            subtasks: {
              type: 'array',
              description: 'Array of subtasks',
              items: {
                type: 'object',
                properties: {
                  _id: {
                    type: 'string',
                    format: 'ObjectId'
                  },
                  title: {
                    type: 'string',
                    description: 'Subtask title'
                  },
                  status: {
                    type: 'string',
                    enum: ['pending', 'completed'],
                    default: 'pending'
                  },
                  createdBy: {
                    type: 'string',
                    format: 'ObjectId',
                    description: 'User ID who created the subtask'
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
              }
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
        },

        // InvoiceTemplate Schema
        InvoiceTemplate: {
          type: 'object',
          required: ['name', 'userId'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Invoice template ID'
            },
            name: {
              type: 'string',
              description: 'Template name',
              example: 'Professional Invoice Template'
            },
            userId: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID who owns the template'
            },
            templateType: {
              type: 'string',
              enum: ['professional', 'modern', 'minimal', 'classic', 'creative', 'custom'],
              default: 'professional',
              description: 'Template design type'
            },
            isDefault: {
              type: 'boolean',
              default: false,
              description: 'Whether this is the default template'
            },
            isSystemDefault: {
              type: 'boolean',
              default: false,
              description: 'Whether this is a system default template'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether template is active'
            },
            companyInfo: {
              type: 'object',
              description: 'Company information for the template',
              properties: {
                name: {
                  type: 'string',
                  description: 'Company name',
                  example: 'MBZ Technology'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Company email',
                  example: 'billing@mbztechnology.com'
                },
                phone: {
                  type: 'string',
                  description: 'Company phone',
                  example: '+27 11 123 4567'
                },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string', example: '123 Business Street' },
                    city: { type: 'string', example: 'Johannesburg' },
                    state: { type: 'string', example: 'Gauteng' },
                    zipCode: { type: 'string', example: '2000' },
                    country: { type: 'string', example: 'South Africa' }
                  }
                },
                website: {
                  type: 'string',
                  description: 'Company website',
                  example: 'https://mbztechnology.com'
                },
                logo: {
                  type: 'string',
                  description: 'Company logo URL',
                  example: 'https://example.com/logo.png'
                }
              }
            },
            design: {
              type: 'object',
              description: 'Template design settings',
              properties: {
                primaryColor: {
                  type: 'string',
                  default: '#000000',
                  description: 'Primary color',
                  example: '#1e40af'
                },
                secondaryColor: {
                  type: 'string',
                  default: '#666666',
                  description: 'Secondary color',
                  example: '#64748b'
                },
                backgroundColor: {
                  type: 'string',
                  default: '#ffffff',
                  description: 'Background color',
                  example: '#ffffff'
                },
                fontFamily: {
                  type: 'string',
                  default: 'Arial, sans-serif',
                  description: 'Font family',
                  example: 'Inter, sans-serif'
                },
                fontSize: {
                  type: 'number',
                  default: 12,
                  description: 'Base font size'
                },
                headerFontSize: {
                  type: 'number',
                  default: 18,
                  description: 'Header font size'
                },
                footerFontSize: {
                  type: 'number',
                  default: 10,
                  description: 'Footer font size'
                }
              }
            },
            layout: {
              type: 'object',
              description: 'Template layout configuration',
              properties: {
                showLogo: {
                  type: 'boolean',
                  default: true,
                  description: 'Show company logo'
                },
                showCompanyInfo: {
                  type: 'boolean',
                  default: true,
                  description: 'Show company information'
                },
                showCustomerInfo: {
                  type: 'boolean',
                  default: true,
                  description: 'Show customer information'
                },
                showItemsTable: {
                  type: 'boolean',
                  default: true,
                  description: 'Show items table'
                },
                showTotals: {
                  type: 'boolean',
                  default: true,
                  description: 'Show totals section'
                },
                showTerms: {
                  type: 'boolean',
                  default: true,
                  description: 'Show terms and conditions'
                },
                showNotes: {
                  type: 'boolean',
                  default: true,
                  description: 'Show notes section'
                }
              }
            },
            fields: {
              type: 'object',
              description: 'Field visibility configuration',
              properties: {
                showInvoiceNumber: {
                  type: 'boolean',
                  default: true,
                  description: 'Show invoice number'
                },
                showIssueDate: {
                  type: 'boolean',
                  default: true,
                  description: 'Show issue date'
                },
                showDueDate: {
                  type: 'boolean',
                  default: true,
                  description: 'Show due date'
                },
                showCustomerAddress: {
                  type: 'boolean',
                  default: true,
                  description: 'Show customer address'
                },
                showItemDescription: {
                  type: 'boolean',
                  default: true,
                  description: 'Show item descriptions'
                },
                showSubtotal: {
                  type: 'boolean',
                  default: true,
                  description: 'Show subtotal'
                },
                showTax: {
                  type: 'boolean',
                  default: true,
                  description: 'Show tax amount'
                },
                showTotal: {
                  type: 'boolean',
                  default: true,
                  description: 'Show total amount'
                }
              }
            },
            createdBy: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID who created the template'
            },
            updatedBy: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID who last updated the template'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Template creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Template last update timestamp'
            }
          }
        },
                 // Affiliate Schema
         Affiliate: {
           type: 'object',
           required: ['userId', 'commissionRate'],
           properties: {
             _id: {
               type: 'string',
               format: 'ObjectId',
               description: 'Affiliate ID'
             },
             userId: {
               type: 'string',
               format: 'ObjectId',
               description: 'User ID who is an affiliate',
               example: '507f1f77bcf86cd799439011'
             },
             status: {
               type: 'string',
               enum: ['pending', 'active', 'suspended', 'terminated'],
               default: 'pending',
               description: 'Affiliate status'
             },
             commissionRate: {
               type: 'number',
               minimum: 0,
               maximum: 100,
               description: 'Commission rate percentage',
               example: 15
             },
             earnings: {
               type: 'object',
               properties: {
                 total: {
                   type: 'number',
                   default: 0,
                   description: 'Total earnings'
                 },
                 pending: {
                   type: 'number',
                   default: 0,
                   description: 'Pending earnings'
                 },
                 paid: {
                   type: 'number',
                   default: 0,
                   description: 'Paid earnings'
                 }
               }
             },
             paymentDetails: {
               type: 'object',
               properties: {
                 paymentMethod: {
                   type: 'string',
                   enum: ['bank_transfer', 'paypal', 'stripe'],
                   description: 'Payment method'
                 },
                 bankName: {
                   type: 'string',
                   description: 'Bank name'
                 },
                 accountNumber: {
                   type: 'string',
                   description: 'Bank account number'
                 },
                 accountName: {
                   type: 'string',
                   description: 'Account holder name'
                 },
                 swiftCode: {
                   type: 'string',
                   description: 'SWIFT/BIC code'
                 },
                 paypalEmail: {
                   type: 'string',
                   description: 'PayPal email address'
                 },
                 stripeAccountId: {
                   type: 'string',
                   description: 'Stripe account ID'
                 }
               }
             },
             trackingCode: {
               type: 'string',
               description: 'Unique tracking code for affiliate'
             },
             marketingMaterials: {
               type: 'array',
               items: {
                 type: 'string',
                 format: 'ObjectId'
               },
               description: 'Array of marketing material IDs'
             },
             performance: {
               type: 'object',
               properties: {
                 totalReferrals: {
                   type: 'number',
                   default: 0,
                   description: 'Total number of referrals'
                 },
                 activeReferrals: {
                   type: 'number',
                   default: 0,
                   description: 'Number of active referrals'
                 },
                 conversionRate: {
                   type: 'number',
                   default: 0,
                   description: 'Conversion rate percentage'
                 },
                 averageOrderValue: {
                   type: 'number',
                   default: 0,
                   description: 'Average order value'
                 }
               }
             },
             settings: {
               type: 'object',
               properties: {
                 minimumPayout: {
                   type: 'number',
                   default: 1000,
                   description: 'Minimum payout amount'
                 },
                 autoPayout: {
                   type: 'boolean',
                   default: false,
                   description: 'Enable automatic payouts'
                 },
                 notifications: {
                   type: 'object',
                   properties: {
                     newReferral: {
                       type: 'boolean',
                       default: true,
                       description: 'Notify on new referral'
                     },
                     conversion: {
                       type: 'boolean',
                       default: true,
                       description: 'Notify on conversion'
                     },
                     payout: {
                       type: 'boolean',
                       default: true,
                       description: 'Notify on payout'
                     }
                   }
                 }
               }
             },
             metadata: {
               type: 'object',
               properties: {
                 website: {
                   type: 'string',
                   description: 'Affiliate website URL'
                 },
                 socialMedia: {
                   type: 'array',
                   items: {
                     type: 'string'
                   },
                   description: 'Social media profiles'
                 },
                 description: {
                   type: 'string',
                   description: 'Affiliate description'
                 },
                 categories: {
                   type: 'array',
                   items: {
                     type: 'string'
                   },
                   description: 'Affiliate categories'
                 },
                 languages: {
                   type: 'array',
                   items: {
                     type: 'string'
                   },
                   description: 'Supported languages'
                 }
               }
             },
             createdAt: {
               type: 'string',
               format: 'date-time',
               description: 'Affiliate creation timestamp'
             },
             lastActive: {
               type: 'string',
               format: 'date-time',
               description: 'Last activity timestamp'
             },
             updatedAt: {
               type: 'string',
               format: 'date-time',
               description: 'Affiliate last update timestamp'
             }
           }
         },
         // Trash Schema
         Trash: {
           type: 'object',
           required: ['sender', 'subject', 'body', 'originalFolder'],
           properties: {
             _id: {
               type: 'string',
               format: 'ObjectId',
               description: 'Trash email ID'
             },
             sender: {
               type: 'string',
               description: 'Email sender address',
               example: 'sender@example.com'
             },
             subject: {
               type: 'string',
               description: 'Email subject line',
               example: 'Important meeting reminder'
             },
             body: {
               type: 'string',
               description: 'Email body content'
             },
             replyTo: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to original email for replies'
             },
             status: {
               type: 'string',
               enum: ['unread', 'read'],
               default: 'unread',
               description: 'Email read status'
             },
             receivedAt: {
               type: 'string',
               format: 'date-time',
               description: 'When email was originally received'
             },
             deletedAt: {
               type: 'string',
               format: 'date-time',
               description: 'When email was moved to trash'
             },
             emailLogs: {
               type: 'array',
               items: {
                 type: 'string',
                 format: 'ObjectId'
               },
               description: 'Array of email log IDs'
             },
             organization: {
               type: 'string',
               format: 'ObjectId',
               description: 'Organization ID'
             },
             user: {
               type: 'string',
               format: 'ObjectId',
               description: 'User ID who owns the email'
             },
             receiver: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the Receiver email account this email came from'
             },
             originalFolder: {
               type: 'string',
               enum: ['inbox', 'sent', 'drafts', 'outbox', 'archived'],
               description: 'Original folder where email was stored'
             },
             createdAt: {
               type: 'string',
               format: 'date-time',
               description: 'Trash entry creation timestamp'
             },
             updatedAt: {
               type: 'string',
               format: 'date-time',
               description: 'Trash entry last update timestamp'
             }
           }
         },
         // Inbox Schema
         Inbox: {
           type: 'object',
           required: ['sender', 'subject', 'body', 'recipient'],
           properties: {
             _id: {
               type: 'string',
               format: 'ObjectId',
               description: 'Inbox email ID'
             },
             sender: {
               type: 'string',
               description: 'Email sender address',
               example: 'sender@example.com'
             },
             subject: {
               type: 'string',
               description: 'Email subject line',
               example: 'Important meeting reminder'
             },
             body: {
               type: 'string',
               description: 'Email body content'
             },
             replyTo: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the original email this is a reply to'
             },
             status: {
               type: 'string',
               enum: ['unread', 'read', 'archived', 'spam'],
               default: 'unread',
               description: 'Email read status'
             },
             receivedAt: {
               type: 'string',
               format: 'date-time',
               description: 'When the email was received'
             },
             emailLogs: {
               type: 'array',
               items: {
                 type: 'string',
                 format: 'ObjectId'
               },
               description: 'Array of email log IDs'
             },
             organization: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the Organization receiving the email'
             },
             user: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the User associated with the inbox'
             },
             receiver: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the Receiver email account this email came from'
             },
             recipient: {
               type: 'string',
               description: 'Email address that received this email',
               example: 'info@mycompany.com'
             },
             createdAt: {
               type: 'string',
               format: 'date-time',
               description: 'Inbox entry creation timestamp'
             },
             updatedAt: {
               type: 'string',
               format: 'date-time',
               description: 'Inbox entry last update timestamp'
             }
           }
         },
         // Email Schema
         Email: {
           type: 'object',
           required: ['recipient', 'subject', 'body', 'createdBy'],
           properties: {
             _id: {
               type: 'string',
               format: 'ObjectId',
               description: 'Email ID'
             },
             recipient: {
               type: 'string',
               description: 'Email recipient address',
               example: 'recipient@example.com'
             },
             subject: {
               type: 'string',
               description: 'Email subject line'
             },
             body: {
               type: 'string',
               description: 'Email body content'
             },
             variables: {
               type: 'object',
               description: 'Key-value pairs for dynamic variables'
             },
             messageId: {
               type: 'string',
               description: 'Email message ID'
             },
             emailTemplate: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the EmailTemplate model'
             },
             campaign: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the Campaign model'
             },
             workflow: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the Workflow model'
             },
             emailLogs: {
               type: 'array',
               items: {
                 type: 'string',
                 format: 'ObjectId'
               },
               description: 'Array of email log IDs'
             },
             createdBy: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the User who initiated the email',
               required: true
             },
             organization: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the Organization associated with the email'
             },
             receiver: {
               type: 'string',
               format: 'ObjectId',
               description: 'Reference to the Receiver email account this email came from'
             },
             status: {
               type: 'string',
               enum: ['trash', 'drafts', 'scheduled', 'sent', 'failed', 'pending'],
               default: 'drafts',
               description: 'Email status'
             },
             errorMessage: {
               type: 'string',
               description: 'Error message if email failed'
             },
             sentAt: {
               type: 'string',
               format: 'date-time',
               description: 'When the email was sent'
             },
             createdAt: {
               type: 'string',
               format: 'date-time',
               description: 'Email creation timestamp'
             },
             updatedAt: {
               type: 'string',
               format: 'date-time',
               description: 'Email last update timestamp'
             }
           }
         },
         // ChatIntegration Schema
         ChatIntegration: {
           type: 'object',
           required: ['provider'],
           properties: {
             _id: {
               type: 'string',
               format: 'ObjectId',
               description: 'Chat integration ID'
             },
             provider: {
               type: 'string',
               description: 'Chat service provider name',
               example: 'Intercom'
             },
             scriptId: {
               type: 'string',
               description: 'Provider script ID for integration',
               example: 'script_12345'
             },
             propertyUrl: {
               type: 'string',
               description: 'Website URL where chat widget is deployed',
               example: 'https://example.com'
             },
             ticketEmail: {
               type: 'string',
               format: 'email',
               description: 'Email for ticket notifications',
               example: 'support@example.com'
             },
             jsApiKey: {
               type: 'string',
               description: 'JavaScript API key for the provider',
               example: 'api_key_12345'
             },
             widgetId: {
               type: 'string',
               description: 'Widget identifier',
               example: 'widget_67890'
             },
             directChatLink: {
               type: 'string',
               description: 'Direct link to chat conversation',
               example: 'https://chat.provider.com/conversation/123'
             },
             isActive: {
               type: 'boolean',
               default: true,
               description: 'Whether the integration is active'
             },
             status: {
               type: 'string',
               default: 'connected',
               description: 'Integration connection status'
             },
             showOnCustomerDashboard: {
               type: 'boolean',
               default: true,
               description: 'Show chat widget on customer dashboard'
             },
             showOnAdminDashboard: {
               type: 'boolean',
               default: false,
               description: 'Show chat widget on admin dashboard'
             },
             createdAt: {
               type: 'string',
               format: 'date-time',
               description: 'Integration creation timestamp'
             },
             updatedAt: {
               type: 'string',
               format: 'date-time',
               description: 'Integration last update timestamp'
             }
           }
         },
         // SupportTicket Schema
         SupportTicket: {
           type: 'object',
           required: ['subject', 'description', 'customer', 'organizationId'],
           properties: {
             _id: {
               type: 'string',
               format: 'ObjectId',
               description: 'Support ticket ID'
             },
             subject: {
               type: 'string',
               description: 'Ticket subject line',
               example: 'Payment issue with subscription'
             },
             description: {
               type: 'string',
               description: 'Detailed description of the issue',
               example: 'I am unable to process my monthly payment'
             },
             category: {
               type: 'string',
               enum: ['technical', 'billing', 'account', 'general'],
               default: 'general',
               description: 'Ticket category'
             },
             priority: {
               type: 'string',
               enum: ['low', 'medium', 'high'],
               default: 'medium',
               description: 'Ticket priority level'
             },
             status: {
               type: 'string',
               enum: ['open', 'in-progress', 'resolved', 'closed'],
               default: 'open',
               description: 'Current ticket status'
             },
             customer: {
               type: 'object',
               required: ['name', 'email'],
               properties: {
                 name: {
                   type: 'string',
                   description: 'Customer name',
                   example: 'John Doe'
                 },
                 email: {
                   type: 'string',
                   format: 'email',
                   description: 'Customer email address',
                   example: 'john@example.com'
                 },
                 avatar: {
                   type: 'string',
                   description: 'Customer avatar URL'
                 }
               }
             },
             organizationId: {
               type: 'string',
               format: 'ObjectId',
               description: 'Organization ID'
             },
             messages: {
               type: 'array',
               items: {
                 type: 'object',
                 properties: {
                   sender: {
                     type: 'string',
                     enum: ['customer', 'support'],
                     description: 'Message sender type'
                   },
                   content: {
                     type: 'string',
                     description: 'Message content'
                   },
                   timestamp: {
                     type: 'string',
                     format: 'date-time',
                     description: 'Message timestamp'
                   },
                   readStatus: {
                     type: 'boolean',
                     description: 'Whether message has been read'
                   }
                 }
               }
             },
             hasUnreadMessages: {
               type: 'boolean',
               default: false,
               description: 'Whether ticket has unread messages'
             },
             chatIntegrations: {
               type: 'array',
               items: {
                 type: 'object',
                 properties: {
                   provider: {
                     type: 'string',
                     description: 'Chat provider name',
                     example: 'tawk'
                   },
                   name: {
                     type: 'string',
                     description: 'Integration name',
                     example: 'Main Support Chat'
                   },
                   apiKey: {
                     type: 'string',
                     description: 'Provider API key'
                   },
                   propertyId: {
                     type: 'string',
                     description: 'Provider property ID'
                   },
                   widgetId: {
                     type: 'string',
                     description: 'Widget identifier'
                   },
                   config: {
                     type: 'object',
                     description: 'Additional configuration options'
                   }
                 }
               }
             },
             createdAt: {
               type: 'string',
               format: 'date-time',
               description: 'Ticket creation timestamp'
             },
             updatedAt: {
               type: 'string',
               format: 'date-time',
               description: 'Ticket last update timestamp'
             }
           }
         },
                   // Product Schema
          Product: {
            type: 'object',
            required: ['name', 'description'],
            properties: {
              _id: {
                type: 'string',
                format: 'ObjectId',
                description: 'Product ID'
              },
              name: {
                type: 'string',
                description: 'Product name',
                example: 'Premium Plan'
              },
              description: {
                type: 'string',
                description: 'Product description',
                example: 'Our most comprehensive plan with all features included'
              },
              isActive: {
                type: 'boolean',
                default: true,
                description: 'Whether the product is active'
              },
              subscriptionPlans: {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'ObjectId'
                },
                description: 'Array of subscription plan IDs associated with this product'
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Product creation timestamp'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Product last update timestamp'
              }
            }
          },
          // MarketingMaterial Schema
          MarketingMaterial: {
            type: 'object',
            required: ['title', 'type', 'url', 'createdBy'],
            properties: {
              _id: {
                type: 'string',
                format: 'ObjectId',
                description: 'Marketing material ID'
              },
              title: {
                type: 'string',
                description: 'Marketing material title',
                example: 'Summer Sale Banner'
              },
              type: {
                type: 'string',
                enum: ['banner', 'video', 'document', 'link'],
                description: 'Type of marketing material'
              },
              url: {
                type: 'string',
                description: 'URL or file path to the material',
                example: 'https://example.com/banner.jpg'
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive'],
                default: 'active',
                description: 'Material status'
              },
              metadata: {
                type: 'object',
                properties: {
                  size: {
                    type: 'string',
                    description: 'File size description',
                    example: '2.5 MB'
                  },
                  format: {
                    type: 'string',
                    description: 'File format',
                    example: 'JPEG'
                  },
                  dimensions: {
                    type: 'string',
                    description: 'Image dimensions',
                    example: '1920x1080'
                  },
                  duration: {
                    type: 'number',
                    description: 'Video duration in seconds',
                    example: 30
                  },
                  fileSize: {
                    type: 'number',
                    description: 'File size in bytes',
                    example: 2621440
                  },
                  mimeType: {
                    type: 'string',
                    description: 'MIME type',
                    example: 'image/jpeg'
                  }
                }
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of tags for categorization',
                example: ['summer', 'sale', 'banner']
              },
              category: {
                type: 'string',
                enum: ['social', 'email', 'website', 'print', 'other'],
                default: 'other',
                description: 'Material category'
              },
              usage: {
                type: 'object',
                properties: {
                  views: {
                    type: 'number',
                    default: 0,
                    description: 'Number of views'
                  },
                  clicks: {
                    type: 'number',
                    default: 0,
                    description: 'Number of clicks'
                  },
                  conversions: {
                    type: 'number',
                    default: 0,
                    description: 'Number of conversions'
                  }
                }
              },
              createdBy: {
                type: 'string',
                format: 'ObjectId',
                description: 'User ID who created the material'
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Material creation timestamp'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Material last update timestamp'
              }
            }
          }
      },
      // Exchange Rate Schema
      ExchangeRate: {
        type: 'object',
        required: ['baseCurrency', 'targetCurrency', 'rate'],
        properties: {
          _id: { type: 'string', format: 'ObjectId', description: 'Exchange rate ID' },
          organizationId: { type: 'string', format: 'ObjectId', description: 'Organization ID (optional for global rates)' },
          baseCurrency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'NGN', 'BTC', 'USDT'], description: 'Base currency code' },
          targetCurrency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'NGN', 'BTC', 'USDT'], description: 'Target currency code' },
          rate: { type: 'number', description: 'Exchange rate value' },
          isCustom: { type: 'boolean', default: false, description: 'Whether this is a custom rate' },
          isGlobal: { type: 'boolean', default: false, description: 'Whether this is a global rate' },
          source: { type: 'string', enum: ['system', 'user', 'api', 'api_cached', 'fallback'], default: 'system', description: 'Rate source' },
          isActive: { type: 'boolean', default: true, description: 'Whether the rate is active' },
          lastApiUpdate: { type: 'string', format: 'date-time', description: 'Last API update timestamp' },
          cacheExpiry: { type: 'string', format: 'date-time', description: 'Cache expiry timestamp' },
          isExpired: { type: 'boolean', default: false, description: 'Whether the rate is expired' },
          apiResponse: {
            type: 'object',
            properties: {
              timeLastUpdate: { type: 'string', format: 'date-time' },
              timeNextUpdate: { type: 'string', format: 'date-time' },
              baseCode: { type: 'string' },
              targetCode: { type: 'string' }
            }
          },
          apiVersion: { type: 'string', default: 'v6', description: 'API version' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        }
      },
      // Subscription Plan Schema
      SubscriptionPlan: {
        type: 'object',
        required: ['name', 'billingInterval'],
        properties: {
          _id: { type: 'string', format: 'ObjectId', description: 'Plan ID' },
          name: { type: 'string', description: 'Plan name', example: 'Standard' },
          features: { type: 'array', items: { type: 'string' }, description: 'Plan features' },
          price: { type: 'number', description: 'Plan price', example: 10 },
          currency: { type: 'string', enum: ['USD', 'NGN', 'EUR', 'GBP'], default: 'USD', description: 'Plan currency' },
          billingInterval: { type: 'string', enum: ['monthly', 'Quarterly', 'yearly'], default: 'monthly', description: 'Billing interval' },
          isActive: { type: 'boolean', default: true, description: 'Whether the plan is active' },
          isCustom: { type: 'boolean', default: false, description: 'Whether this is a custom plan' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        }
      },
      // Subscription Schema
      Subscription: {
        type: 'object',
        required: ['user', 'plan', 'billingInterval', 'currency'],
        properties: {
          _id: { type: 'string', format: 'ObjectId', description: 'Subscription ID' },
          user: { type: 'string', format: 'ObjectId', description: 'User ID' },
          plan: { type: 'string', format: 'ObjectId', description: 'Subscription plan ID' },
          isTrial: { type: 'boolean', default: false, description: 'Whether this is a trial subscription' },
          trialStart: { type: 'string', format: 'date-time', description: 'Trial start date' },
          trialEnd: { type: 'string', format: 'date-time', description: 'Trial end date' },
          trialConverted: { type: 'boolean', default: false, description: 'Whether trial was converted to paid' },
          billingInterval: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly', description: 'Billing interval' },
          currency: { type: 'string', enum: ['USD', 'NGN', 'EUR', 'GBP', 'BTC', 'USDT'], default: 'USD', description: 'Subscription currency' },
          startDate: { type: 'string', format: 'date-time', default: 'Date.now', description: 'Subscription start date' },
          endDate: { type: 'string', format: 'date-time', description: 'Subscription end date' },
          renewalDate: { type: 'string', format: 'date-time', description: 'Next renewal date' },
          isActive: { type: 'boolean', default: false, description: 'Whether subscription is active' },
          paymentStatus: { type: 'string', enum: ['Paid', 'Pending', 'Failed'], default: 'Pending', description: 'Payment status' },
          status: { type: 'string', enum: ['active', 'pending', 'canceled', 'expired'], default: 'pending', description: 'Subscription status' },
          payment: { type: 'string', format: 'ObjectId', description: 'Payment ID' },
          paymentMethod: { type: 'string', enum: ['flutterwave', 'paystack', 'squad', 'bank'], description: 'Payment method used' },
          activatedAt: { type: 'string', format: 'date-time', description: 'Subscription activation timestamp' },
          canceledAt: { type: 'string', format: 'date-time', description: 'Cancellation date' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        }
      },
      // Payment Schema
      Payment: {
        type: 'object',
        required: ['user', 'gateway', 'amount', 'currency', 'reference'],
        properties: {
          _id: { type: 'string', format: 'ObjectId', description: 'Payment ID' },
          user: { type: 'string', format: 'ObjectId', description: 'User ID' },
          subscription: { type: 'string', format: 'ObjectId', description: 'Subscription ID' },
          plan: { type: 'string', format: 'ObjectId', description: 'Plan ID' },
          gateway: { type: 'string', enum: ['flutterwave', 'paystack', 'squad', 'bank', 'crypto'], description: 'Payment gateway' },
          amount: { type: 'number', description: 'Payment amount' },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'NGN', 'BTC', 'USDT'], description: 'Payment currency' },
          status: { type: 'string', enum: ['pending', 'success', 'failed', 'manual_review'], default: 'pending', description: 'Payment status' },
          reference: { type: 'string', description: 'Payment reference (unique)' },
          paymentData: { type: 'object', description: 'Gateway response data' },
          screenshotUrl: { type: 'string', description: 'Bank transfer proof URL' },
          verifiedAt: { type: 'string', format: 'date-time', description: 'Payment verification timestamp' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        }
      },
      // Payment Gateway Key Schema
      PaymentGatewayKey: {
        type: 'object',
        required: ['type', 'publicKey', 'secretKey'],
        properties: {
          _id: { type: 'string', format: 'ObjectId', description: 'Gateway key ID' },
          name: { type: 'string', description: 'Gateway name' },
          description: { type: 'string', description: 'Gateway description' },
          logoUrl: { type: 'string', description: 'Gateway logo URL' },
          type: { type: 'string', enum: ['flutterwave', 'paystack', 'crypto', 'squad'], description: 'Gateway type (unique)' },
          publicKey: { type: 'string', description: 'Public key' },
          secretKey: { type: 'string', description: 'Secret key' },
          isActive: { type: 'boolean', default: true, description: 'Whether gateway is active' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        }
      },
      // Payment Webhook Schemas
      FlutterwaveWebhook: {
        type: 'object',
        properties: {
          event: { type: 'string', example: 'charge.completed', description: 'Webhook event type' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '123456', description: 'Transaction ID' },
              tx_ref: { type: 'string', example: 'FLW-123456789', description: 'Transaction reference' },
              amount: { type: 'number', example: 1000, description: 'Amount in kobo' },
              currency: { type: 'string', example: 'NGN', description: 'Currency' },
              status: { type: 'string', example: 'successful', description: 'Payment status' }
            }
          }
        }
      },
      PaystackWebhook: {
        type: 'object',
        properties: {
          event: { type: 'string', example: 'charge.success', description: 'Webhook event type' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '123456', description: 'Transaction ID' },
              reference: { type: 'string', example: 'PAYSTACK-123456789', description: 'Transaction reference' },
              amount: { type: 'number', example: 100000, description: 'Amount in kobo' },
              currency: { type: 'string', example: 'NGN', description: 'Currency' },
              status: { type: 'string', example: 'success', description: 'Payment status' }
            }
          }
        }
      },
      SquadWebhook: {
        type: 'object',
        properties: {
          event: { type: 'string', example: 'payment.completed', description: 'Webhook event type' },
          data: {
            type: 'object',
            properties: {
              transaction_ref: { type: 'string', example: 'SQUAD-123456789', description: 'Transaction reference' },
              amount: { type: 'number', example: 100000, description: 'Amount in kobo' },
              currency: { type: 'string', example: 'NGN', description: 'Currency' },
              status: { type: 'string', example: 'success', description: 'Payment status' }
            }
          }
        }
      },
      // Website Schema
      Website: {
        type: 'object',
        required: ['organization', 'businessName', 'businessType', 'domain', 'description'],
        properties: {
          _id: { type: 'string', format: 'ObjectId', description: 'Website ID' },
          organization: { type: 'string', format: 'ObjectId', description: 'Organization ID' },
          businessName: { type: 'string', description: 'Business name', maxLength: 100 },
          businessType: { type: 'string', enum: ['Fashion & Apparel', 'Electronics & Gadgets', 'Food & Beverages', 'Home & Furniture', 'Health & Beauty', 'Sports & Fitness', 'Books & Media', 'Art & Crafts', 'Services', 'Other'], description: 'Business type' },
          domain: { type: 'string', description: 'Domain name', pattern: '^[a-z0-9-]+$' },
          description: { type: 'string', description: 'Business description', maxLength: 500 },
          logo: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Logo URL' },
              publicId: { type: 'string', description: 'Cloudinary public ID' },
              originalName: { type: 'string', description: 'Original file name' }
            }
          },
          needLogoDesign: { type: 'boolean', default: false, description: 'Whether logo design is needed' },
          logoDesignNotes: { type: 'string', maxLength: 500, description: 'Logo design notes' },
          template: { type: 'string', format: 'ObjectId', description: 'Selected template ID' },
          primaryColor: { type: 'string', default: '#800020', description: 'Primary color' },
          secondaryColor: { type: 'string', default: '#0A2472', description: 'Secondary color' },
          complementaryColor: { type: 'string', default: '#e18d01', description: 'Complementary color' },
          businessAddress: { type: 'string', maxLength: 500, description: 'Business address' },
          businessContactInfo: { type: 'string', maxLength: 500, description: 'Contact information' },
          supportEmail: { type: 'string', format: 'email', description: 'Support email' },
          status: { type: 'string', enum: ['draft', 'in_progress', 'completed', 'published'], default: 'draft', description: 'Website status' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        }
      },
      // Currency Conversion Response Schema
      CurrencyConversion: {
        type: 'object',
        properties: {
          success: { type: 'boolean', description: 'Conversion success status' },
          data: {
            type: 'object',
            properties: {
              originalAmount: { type: 'number', description: 'Original amount' },
              fromCurrency: { type: 'string', description: 'Source currency' },
              toCurrency: { type: 'string', description: 'Target currency' },
              convertedAmount: { type: 'number', description: 'Converted amount' },
              exchangeRate: { type: 'number', description: 'Exchange rate used' },
              timestamp: { type: 'string', format: 'date-time', description: 'Conversion timestamp' }
            }
          }
        }
      },
      // Plan Pricing Response Schema
      PlanPricing: {
        type: 'object',
        properties: {
          success: { type: 'boolean', description: 'Request success status' },
          data: {
            type: 'object',
            properties: {
              planId: { type: 'string', format: 'ObjectId', description: 'Plan ID' },
              planName: { type: 'string', description: 'Plan name' },
              originalPrice: { type: 'number', description: 'Original plan price' },
              originalCurrency: { type: 'string', description: 'Original currency' },
              convertedPrice: { type: 'number', description: 'Converted price' },
              targetCurrency: { type: 'string', description: 'Target currency' },
              exchangeRate: { type: 'number', description: 'Exchange rate used' },
              timestamp: { type: 'string', format: 'date-time', description: 'Conversion timestamp' }
            }
          }
        }
      },
      // Email Signature Schema
      EmailSignature: {
        type: 'object',
        required: ['name', 'content', 'user', 'organization'],
        properties: {
          _id: { type: 'string', format: 'ObjectId', description: 'Unique signature ID' },
          name: { type: 'string', description: 'Signature name', example: 'Professional' },
          content: { type: 'string', description: 'HTML content of the signature', example: '<p><strong>John Doe</strong><br>Marketing Director</p>' },
          isDefault: { type: 'boolean', description: 'Whether this is the default signature', default: false },
          user: { type: 'string', format: 'ObjectId', description: 'User ID who owns this signature' },
          organization: { type: 'string', format: 'ObjectId', description: 'Organization ID' },
          isActive: { type: 'boolean', description: 'Whether the signature is active', default: true },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        }
      },
      // Receipt Schema
      Receipt: {
        type: 'object',
        required: ['organizationId', 'userId', 'customerName', 'customerEmail', 'items', 'totalAmount', 'paymentMethod', 'scenario'],
        properties: {
          _id: {
            type: 'string',
            format: 'ObjectId',
            description: 'Unique receipt ID'
          },
          receiptNumber: {
            type: 'string',
            description: 'Auto-generated receipt number'
          },
          customerId: {
            type: 'string',
            format: 'ObjectId',
            description: 'Customer ID (required for woocommerce_order scenario)'
          },
          storeId: {
            type: 'string',
            format: 'ObjectId',
            description: 'Store ID (required for woocommerce_order scenario)'
          },
          organizationId: {
            type: 'string',
            format: 'ObjectId',
            description: 'Organization ID'
          },
          userId: {
            type: 'string',
            format: 'ObjectId',
            description: 'User ID who created the receipt'
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
            description: 'Customer address information'
          },
          subscriptionId: {
            type: 'string',
            format: 'ObjectId',
            description: 'Subscription ID (required for subscription_payment scenario)'
          },
          paymentId: {
            type: 'string',
            format: 'ObjectId',
            description: 'Payment ID (required for subscription_payment scenario)'
          },
          scenario: {
            type: 'string',
            enum: ['woocommerce_order', 'subscription_payment'],
            description: 'Receipt scenario type'
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
                totalPrice: {
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
            default: 'USD',
            description: 'Currency code'
          },
          paymentMethod: {
            type: 'string',
            description: 'Payment method used'
          },
          paymentMethodDetails: {
            type: 'object',
            description: 'Additional payment method details'
          },
          transactionId: {
            type: 'string',
            description: 'External transaction ID'
          },
          transactionDate: {
            type: 'string',
            format: 'date-time',
            description: 'Transaction date'
          },
          description: {
            type: 'string',
            description: 'Additional description'
          },
          type: {
            type: 'string',
            enum: ['purchase', 'refund', 'exchange'],
            default: 'purchase',
            description: 'Receipt type'
          },
          templateId: {
            type: 'string',
            format: 'ObjectId',
            description: 'Receipt template ID'
          },
          status: {
            type: 'string',
            enum: ['active', 'cancelled', 'refunded'],
            default: 'active',
            description: 'Receipt status'
          },
          emailSent: {
            type: 'boolean',
            default: false,
            description: 'Whether receipt was emailed'
          },
          emailSentDate: {
            type: 'string',
            format: 'date-time',
            description: 'When receipt was emailed'
          },
          emailRecipients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  format: 'email'
                },
                sentAt: {
                  type: 'string',
                  format: 'date-time'
                },
                status: {
                  type: 'string',
                  enum: ['sent', 'failed']
                }
              }
            }
          },
          refundAmount: {
            type: 'number',
            description: 'Refund amount'
          },
          refundDate: {
            type: 'string',
            format: 'date-time',
            description: 'Refund date'
          },
          refundReason: {
            type: 'string',
            description: 'Reason for refund'
          },
          templatePreferences: {
            type: 'object',
            properties: {
              defaultOrderTemplate: {
                type: 'string',
                format: 'ObjectId',
                description: 'Default template for order receipts'
              },
              defaultSubscriptionTemplate: {
                type: 'string',
                format: 'ObjectId',
                description: 'Default template for subscription receipts'
              },
              autoGenerateOrderReceipts: {
                type: 'boolean',
                default: true,
                description: 'Auto-generate receipts for orders'
              },
              autoGenerateSubscriptionReceipts: {
                type: 'boolean',
                default: true,
                description: 'Auto-generate receipts for subscriptions'
              }
            }
          },
          createdBy: {
            type: 'string',
            format: 'ObjectId',
            description: 'User ID who created the receipt'
          },
          updatedBy: {
            type: 'string',
            format: 'ObjectId',
            description: 'User ID who last updated the receipt'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Receipt creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Receipt last update timestamp'
          }
        }
      },
      // Receipt Template Schema
      ReceiptTemplate: {
        type: 'object',
        required: ['name', 'organizationId', 'userId'],
        properties: {
          _id: {
            type: 'string',
            format: 'ObjectId',
            description: 'Unique template ID'
          },
          name: {
            type: 'string',
            description: 'Template name'
          },
          description: {
            type: 'string',
            description: 'Template description'
          },
          scenario: {
            type: 'string',
            enum: ['woocommerce_order', 'subscription_payment', 'universal'],
            default: 'universal',
            description: 'Template scenario type'
          },
          design: {
            type: 'object',
            description: 'Template design settings'
          },
          layout: {
            type: 'object',
            description: 'Template layout configuration'
          },
          content: {
            type: 'object',
            description: 'Template content structure'
          },
          fields: {
            type: 'array',
            description: 'Template fields configuration'
          },
          isSystemDefault: {
            type: 'boolean',
            default: false,
            description: 'Whether this is a system default template'
          },
          isActive: {
            type: 'boolean',
            default: true,
            description: 'Whether template is active'
          },
          organizationId: {
            type: 'string',
            format: 'ObjectId',
            description: 'Organization ID (null for system defaults)'
          },
          userId: {
            type: 'string',
            format: 'ObjectId',
            description: 'User ID who created the template'
          },
          createdBy: {
            type: 'string',
            format: 'ObjectId',
            description: 'User ID who created the template'
          },
          updatedBy: {
            type: 'string',
            format: 'ObjectId',
            description: 'User ID who last updated the template'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Template creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Template last update timestamp'
          }
        },
        // Onboarding Schema
        Onboarding: {
          type: 'object',
          required: ['organizationId', 'userId'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Onboarding record ID'
            },
            organizationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID',
              example: '60d0fe4f3a7b1c001f1e3a4b'
            },
            userId: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID (main user of organization)',
              example: '60d0fe4f3a7b1c001f1e3a4c'
            },
            currentStep: {
              type: 'number',
              minimum: 1,
              maximum: 4,
              default: 1,
              description: 'Current onboarding step (1-4)',
              example: 2
            },
            completedSteps: {
              type: 'array',
              items: {
                type: 'number',
                minimum: 1,
                maximum: 4
              },
              description: 'Array of completed step numbers',
              example: [1]
            },
            isOnboardingComplete: {
              type: 'boolean',
              default: false,
              description: 'Whether onboarding is fully complete',
              example: false
            },
            onboardingStartedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When onboarding was started',
              example: '2023-12-01T10:00:00.000Z'
            },
            onboardingCompletedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When onboarding was completed',
              example: null
            },
            skippedOnboarding: {
              type: 'boolean',
              default: false,
              description: 'Whether user skipped onboarding',
              example: false
            },
            storeSetup: {
              type: 'object',
              properties: {
                isComplete: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether store setup is complete'
                },
                completedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When store setup was completed'
                },
                storeId: {
                  type: 'string',
                  format: 'ObjectId',
                  description: 'Created store ID'
                },
                setupMode: {
                  type: 'string',
                  enum: ['new', 'existing'],
                  description: 'How store was set up'
                }
              }
            },
            planSelection: {
              type: 'object',
              properties: {
                isComplete: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether plan selection is complete'
                },
                completedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When plan was selected'
                },
                planId: {
                  type: 'string',
                  format: 'ObjectId',
                  description: 'Selected plan ID'
                },
                subscriptionId: {
                  type: 'string',
                  format: 'ObjectId',
                  description: 'Created subscription ID'
                },
                isTrialActivated: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether trial was activated'
                }
              }
            },
            platformTour: {
              type: 'object',
              properties: {
                isComplete: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether platform tour is complete'
                },
                completedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When tour was completed'
                },
                completedModules: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['stores', 'tasks', 'inventory', 'billing', 'analytics', 'customers', 'marketing', 'settings', 'user-management', 'integrations', 'customer-support', 'audit-logs', 'invoices']
                  },
                  description: 'Completed tour modules',
                  example: ['stores', 'tasks', 'analytics']
                },
                dashboardTourCompleted: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether dashboard tour is completed'
                },
                moduleToursCompleted: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      moduleId: {
                        type: 'string',
                        enum: ['stores', 'tasks', 'inventory', 'billing', 'analytics', 'customers', 'marketing', 'settings', 'user-management', 'integrations', 'customer-support', 'audit-logs', 'invoices']
                      },
                      completedAt: {
                        type: 'string',
                        format: 'date-time'
                      },
                      completedBy: {
                        type: 'string',
                        format: 'ObjectId'
                      },
                      timeSpent: {
                        type: 'number',
                        description: 'Time spent in minutes'
                      },
                      tourType: {
                        type: 'string',
                        enum: ['interactive', 'video', 'help']
                      }
                    }
                  },
                  description: 'Individual module tour completion tracking'
                },
                moduleProgress: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      moduleId: {
                        type: 'string'
                      },
                      isCompleted: {
                        type: 'boolean'
                      },
                      completedAt: {
                        type: 'string',
                        format: 'date-time'
                      },
                      timeSpent: {
                        type: 'number'
                      },
                      lastAccessedAt: {
                        type: 'string',
                        format: 'date-time'
                      },
                      progressPercentage: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100
                      }
                    }
                  },
                  description: 'Module progress tracking'
                }
              }
            },
            onboardingPreferences: {
              type: 'object',
              properties: {
                skipTutorials: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether to skip tutorials'
                },
                showTips: {
                  type: 'boolean',
                  default: true,
                  description: 'Whether to show tips'
                }
              }
            },
            timeSpentOnSteps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step: {
                    type: 'number',
                    minimum: 1,
                    maximum: 4
                  },
                  durationSeconds: {
                    type: 'number',
                    minimum: 0
                  },
                  startedAt: {
                    type: 'string',
                    format: 'date-time'
                  },
                  endedAt: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              },
              description: 'Time spent on each step'
            },
            lastActivityAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last activity timestamp',
              example: '2023-12-01T15:30:00.000Z'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record last update timestamp'
            }
          }
        },

        // CallScheduler Schema
        CallScheduler: {
          type: 'object',
          required: ['organizationId', 'userId', 'title', 'startTime', 'endTime'],
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'Call scheduler ID'
            },
            organizationId: {
              type: 'string',
              format: 'ObjectId',
              description: 'Organization ID',
              example: '60d0fe4f3a7b1c001f1e3a4b'
            },
            userId: {
              type: 'string',
              format: 'ObjectId',
              description: 'User ID who created the call',
              example: '60d0fe4f3a7b1c001f1e3a4c'
            },
            title: {
              type: 'string',
              description: 'Call title',
              example: 'Weekly Team Sync'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Call description',
              example: 'Weekly team meeting to discuss project updates'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: 'Call start time',
              example: '2024-01-15T10:00:00Z'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              description: 'Call end time',
              example: '2024-01-15T11:00:00Z'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'cancelled', 'completed'],
              default: 'scheduled',
              description: 'Call status'
            },
            participants: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ObjectId'
              },
              description: 'Array of user IDs participating in the call'
            },
            externalParticipants: {
              type: 'array',
              description: 'External participants not in the system',
              items: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'External participant name',
                    example: 'John Doe'
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'External participant email',
                    example: 'john.doe@example.com'
                  },
                  invitedAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'When invitation was sent'
                  },
                  invitationSent: {
                    type: 'boolean',
                    default: false,
                    description: 'Whether invitation was sent'
                  }
                }
              }
            },
            meetingLink: {
              type: 'string',
              description: 'Meeting link (Zoom, Teams, etc.)',
              example: 'https://zoom.us/j/123456789'
            },
            // Recurring meeting fields
            isRecurring: {
              type: 'boolean',
              default: false,
              description: 'Whether this is a recurring meeting'
            },
            recurrencePattern: {
              type: 'string',
              enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'],
              description: 'Recurrence pattern for recurring meetings'
            },
            recurrenceEndDate: {
              type: 'string',
              format: 'date-time',
              description: 'When recurring meetings should end'
            },
            recurrenceInterval: {
              type: 'number',
              default: 1,
              description: 'Recurrence interval (every X days/weeks/months)'
            },
            recurrenceDays: {
              type: 'array',
              items: {
                type: 'number',
                minimum: 0,
                maximum: 6
              },
              description: 'Days of week for custom recurrence (0=Sunday, 6=Saturday)'
            },
            // Timezone support
            timezone: {
              type: 'string',
              default: 'UTC',
              description: 'Meeting timezone',
              example: 'Africa/Johannesburg'
            },
            organizerTimezone: {
              type: 'string',
              default: 'UTC',
              description: 'Organizer timezone',
              example: 'Africa/Johannesburg'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record last update timestamp'
            }
          }
        },

        // Timezone Conversion Response Schema
        TimezoneConversion: {
          type: 'object',
          properties: {
            participant: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Participant ID'
                },
                name: {
                  type: 'string',
                  description: 'Participant name'
                },
                email: {
                  type: 'string',
                  description: 'Participant email'
                },
                timezone: {
                  type: 'string',
                  description: 'Participant timezone'
                }
              }
            },
            meetingTime: {
              type: 'object',
              properties: {
                time: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Converted meeting time'
                },
                display: {
                  type: 'string',
                  description: 'Human-readable time format'
                },
                timezone: {
                  type: 'string',
                  description: 'Target timezone'
                },
                offset: {
                  type: 'string',
                  description: 'Timezone offset'
                },
                isDST: {
                  type: 'boolean',
                  description: 'Whether daylight saving time is active'
                }
              }
            },
            timezoneDisplayName: {
              type: 'string',
              description: 'User-friendly timezone name'
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
        name: 'Call Scheduler',
        description: 'Call scheduling and timezone management operations'
      },
      {
        name: 'Feedback',
        description: 'Feedback management operations'
      },
      {
        name: 'Surveys',
        description: 'Survey management operations'
      },
      {
        name: 'Survey Responses',
        description: 'Survey response management operations'
      },
      {
        name: 'Suggestions',
        description: 'Community suggestion management operations'
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
        name: 'Invoice Templates',
        description: 'Invoice template management operations'
      },
      {
        name: 'Receipt Templates',
        description: 'Receipt template management operations'
      },
      {
        name: 'Shipping',
        description: 'Shipping label management operations'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting operations'
      },
      {
        name: 'Onboarding',
        description: 'Onboarding process management operations'
      },
             {
         name: 'Affiliates',
         description: 'Affiliate management operations'
       },
       {
         name: 'Trash',
         description: 'Email trash management operations'
       },
       {
         name: 'Chat Integration',
         description: 'Chat service integration management operations'
       },
       {
         name: 'Support',
         description: 'Support ticket management operations'
       },
       {
         name: 'Marketing Materials',
         description: 'Marketing material management operations'
       },
       {
         name: 'Exchange Rates',
         description: 'Exchange rate and currency conversion operations'
       },
       {
         name: 'Subscriptions',
         description: 'Subscription management operations'
       },
       {
         name: 'Subscription Plans',
         description: 'Subscription plan management operations'
       },
       {
         name: 'Payments',
         description: 'Payment processing operations'
       },
       {
         name: 'Payment Gateways',
         description: 'Payment gateway management operations'
       },
       {
         name: 'Self Service',
         description: 'Self-service portal operations for employees'
       },
       {
         name: 'Content Management',
         description: 'Content management system operations'
       },
       {
         name: 'Email Signatures',
         description: 'Email signature management operations'
       },
       {
         name: 'Job Postings',
         description: 'Job posting and application management operations'
       }
    ]
  },
  apis: [
    './routes/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
