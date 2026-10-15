module.exports = {
  apps: [
    {
      name: 'teoslinker-bot',
      cwd: '.',
      script: 'src/index.js',
      node_args: '--max-old-space-size=460',
      instances: 1,
      autorestart: true,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production',
        PORT: '8082',
        MCP_API: 'http://localhost:8090',
        MCP_ENGINE_URL: 'http://localhost:8090',
        ACTIVATION_API: 'http://localhost:8080'
      },
      env_production: {
        NODE_ENV: 'production',
        MCP_API: 'https://agent-code-risk-mcp-production.up.railway.app',
        MCP_ENGINE_URL: 'https://agent-code-risk-mcp-production.up.railway.app',
        ACTIVATION_API: 'https://activation-service-production-a368.up.railway.app'
      }
    }
  ]
};
