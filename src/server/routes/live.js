const router = require('express').Router();

router.get('/live', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok' });
});

module.exports = router;