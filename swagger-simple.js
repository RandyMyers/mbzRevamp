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
      }
    }
  },
  apis: [
    './routes/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
