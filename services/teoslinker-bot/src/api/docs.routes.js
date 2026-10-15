const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TEOS Sovereign Sentinel API',
      version: '2.0.0',
      description: 'AI Execution Firewall — Scan code, audit dependencies, and block threats before execution.',
    },
    servers: [
      { url: 'http://localhost:8082', description: 'Local development' },
    ],
    components: {
      securitySchemes: {
        TeosToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-TEOS-Token',
          description: 'API token obtained via /api/auth/token or Telegram bot',
        },
      },
    },
  },
  apis: ['./src/api/*.routes.js', './src/index.js'],
};

const spec = swaggerJsdoc(options);

function registerDocsRoutes(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TEOS Sentinel API Docs',
  }));
  app.get('/api-docs.json', (req, res) => res.json(spec));
}

module.exports = { registerDocsRoutes };
