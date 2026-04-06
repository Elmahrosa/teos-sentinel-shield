import express from 'express';
const app = express();

app.get('/', (req, res) => {
  res.send('✅ Agent Code Risk MCP is live on app.teosegypt.com');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agent-code-risk-mcp' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
