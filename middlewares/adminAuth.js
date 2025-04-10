const jwt = require('jsonwebtoken');
const config = require('../config/default');
const adminModel = require('../models/admin');
const logger = require('../utils/logger');

/**
 * JWT身份验证中间件 - 用于API路由
 */
function authJWT(req, res, next) {
  // 从请求头中获取token
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    logger.warn('API请求缺少JWT令牌', { path: req.path });
    return res.status(401).json({
      success: false,
      message: '未提供身份验证令牌'
    });
  }
  
  try {
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('无效的JWT令牌', { path: req.path, error: error.message });
    return res.status(401).json({
      success: false,
      message: '身份验证令牌无效或已过期'
    });
  }
}

/**
 * 会话身份验证中间件 - 用于网页路由
 */
function authSession(req, res, next) {
  // 确保会话对象存在
  if (!req.session) {
    logger.error('会话对象不存在', { path: req.path });
    return res.status(500).json({
      success: false,
      message: '服务器会话配置错误'
    });
  }
  
  if (!req.session.user || !req.session.user.isAdmin) {
    logger.warn('用户未登录或非管理员', { path: req.path, session: req.session.id });
    
    // 如果是API请求，返回JSON响应
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({
        success: false,
        message: '未登录或无权限'
      });
    }
    
    // 如果是网页请求，重定向到登录页面
    return res.redirect('/admin/login');
  }
  
  logger.debug('用户认证成功', { 
    username: req.session.user.username,
    path: req.path
  });
  
  next();
}

/**
 * 验证管理员凭据
 */
function validateCredentials(username, password) {
  try {
    return adminModel.validateAdmin(username, password);
  } catch (error) {
    logger.error('验证管理员凭据错误:', error);
    return false;
  }
}

module.exports = {
  authJWT,
  authSession,
  validateCredentials
};