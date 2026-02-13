// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WattBeaber API',
      version: '1.0.0',
      description: 'API REST para sistema de monitoreo energético e hídrico',
      contact: {
        name: 'WattBeaber Team',
        email: 'support@wattnbeaber.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.api.prefix}/${config.api.version}`,
        description: 'Servidor de desarrollo'
      },
      {
        url: `http://wattnbeaber.local:${config.port}${config.api.prefix}/${config.api.version}`,
        description: 'Servidor local (Raspberry Pi)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación'
      },
      {
        name: 'Energy',
        description: 'Endpoints de monitoreo energético'
      },
      {
        name: 'Water',
        description: 'Endpoints de monitoreo hídrico'
      },
      {
        name: 'Gamification',
        description: 'Sistema de gamificación: puntos, logros, retos'
      },
      {
        name: 'Reports',
        description: 'Reportes diarios, semanales y mensuales'
      },
      {
        name: 'Notifications',
        description: 'Sistema de notificaciones'
      },
      {
        name: 'Goals',
        description: 'Metas de ahorro de energía y agua'
      },
      {
        name: 'Households',
        description: 'Hogares compartidos entre usuarios'
      }
    ]
  },
  apis: ['./src/routes/**/*.js', './src/routes/*/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};