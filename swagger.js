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
        url: 'https://mbzrevamp.onrender.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:8800',
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
