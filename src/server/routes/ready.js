const router = require('express').Router();

router.get('/ready', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ready' });
});

module.exports = router;