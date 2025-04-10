const express = require('express');
const router = express.Router();
const { upload } = require('../services/fileService');
const apiKeyAuth = require('../middlewares/apiKeyAuth');
const {
  translateTextController,
  translateTableController,
  translateFileController
} = require('../controllers/translationController');

// 所有翻译路由都需要API密钥验证
router.use(apiKeyAuth);

// 文本翻译
router.post('/text', translateTextController);

// 表格翻译
router.post('/table', translateTableController);

// 文件翻译
router.post('/file', upload.single('file'), translateFileController);

module.exports = router;