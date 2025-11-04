// routes/index.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'User Registration API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      payments: '/api/payments'
    }
  });
});

module.exports = router;