const express = require('express');
const router = express.Router();
const path = require('path');
const { authSession } = require('../middlewares/adminAuth');
const {
  login,
  logout,
  changePassword,
  getSettings,
  updateSettings,
  getAllApiKeys,
  createApiKey,
  deleteApiKey
} = require('../controllers/adminController');

// 登录页面
router.get('/login', (req, res) => {
  if (req.session.user && req.session.user.isAdmin) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

// 登录API
router.post('/api/login', login);

// 登出API
router.post('/api/logout', authSession, logout);

// 重要：修复根路由处理
// 管理员控制台主页 - 这里是关键的路由，必须直接检查会话
router.get('/', (req, res) => {
  // 直接检查会话状态，不使用中间件
  if (!req.session || !req.session.user || !req.session.user.isAdmin) {
    console.log('用户未认证，重定向到登录页面');
    return res.redirect('/admin/login');
  }
  
  // 用户已认证，显示管理控制台
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// 所有其他API路由使用中间件进行身份验证
// 更改密码
router.post('/api/change-password', authSession, changePassword);

// 设置管理
router.get('/api/settings', authSession, getSettings);
router.post('/api/settings', authSession, updateSettings);

// API密钥管理
router.get('/api/keys', authSession, getAllApiKeys);
router.post('/api/keys', authSession, createApiKey);
router.delete('/api/keys/:id', authSession, deleteApiKey);

module.exports = router;