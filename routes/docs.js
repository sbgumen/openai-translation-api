const express = require('express');
const router = express.Router();
const path = require('path');

// API文档首页
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/docs/index.html'));
});

module.exports = router;