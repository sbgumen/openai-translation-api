const apiKeyModel = require('../models/apiKey');
const logger = require('../utils/logger');

/**
 * API密钥认证中间件
 */
function apiKeyAuth(req, res, next) {
  // 从请求头中获取API密钥，支持多种可能的格式
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'] || req.headers['api-key'] || req.query.apiKey;
  
  // 检查API密钥是否存在
  if (!apiKey) {
    logger.warn('API请求缺少密钥', { path: req.path, ip: req.ip });
    return res.status(401).json({
      success: false,
      message: '缺少API密钥，请提供有效的x-api-key请求头'
    });
  }
  
  // 验证API密钥是否有效
  try {
    const keyData = apiKeyModel.validateKey(apiKey);
    
    if (!keyData) {
      logger.warn('无效的API密钥', { path: req.path, ip: req.ip, key: apiKey.substring(0, 4) + '...' });
      return res.status(401).json({
        success: false,
        message: 'API密钥无效或已过期'
      });
    }
    
    // 将API密钥信息存储在请求对象中，供后续处理使用
    req.apiKeyData = keyData;
    
    // 记录有效的API请求
    logger.info('有效的API请求', { 
      path: req.path, 
      keyName: keyData.name,
      usageCount: keyData.usageCount
    });
    
    // 继续处理请求
    next();
  } catch (error) {
    logger.error('验证API密钥错误', { path: req.path, error: error.message });
    return res.status(500).json({
      success: false,
      message: '验证API密钥时发生错误',
      error: error.message
    });
  }
}

module.exports = apiKeyAuth;