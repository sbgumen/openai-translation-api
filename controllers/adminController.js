const jwt = require('jsonwebtoken');
const config = require('../config/default');
const adminModel = require('../models/admin');
const apiKeyModel = require('../models/apiKey');
const { validateCredentials } = require('../middlewares/adminAuth');
const { refreshOpenAIInstance } = require('../services/openai');
const logger = require('../utils/logger');

/**
 * 管理员登录
 */
function login(req, res, next) {
  try {
    const { username, password } = req.body;
    
    // 验证凭据
    const isValid = validateCredentials(username, password);
    
    if (!isValid) {
      logger.warn('登录失败：凭据无效', { username });
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    logger.info('管理员登录成功', { username });
    
    // 生成JWT令牌
    const token = jwt.sign(
      { username, isAdmin: true },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // 设置会话
    req.session.user = { username, isAdmin: true };
    req.session.save();
    
    // 返回令牌
    return res.json({
      success: true,
      token,
      user: { username }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 管理员登出
 */
function logout(req, res) {
  if (req.session.user) {
    logger.info('管理员登出', { username: req.session.user.username });
  }
  
  // 清除会话
  req.session.destroy((err) => {
    if (err) {
      logger.error('销毁会话时出错', { error: err.message });
      return res.status(500).json({
        success: false,
        message: '登出时发生错误'
      });
    }
    
    // 返回响应
    res.json({
      success: true,
      message: '已成功登出'
    });
  });
}

/**
 * 更改管理员密码
 */
function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 验证当前密码
    const isValid = validateCredentials(config.admin.username, currentPassword);
    
    if (!isValid) {
      logger.warn('密码更改失败：当前密码错误');
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }
    
    // 更新密码
    adminModel.updateAdminPassword(newPassword);
    logger.info('管理员密码已更新');
    
    // 返回响应
    res.json({
      success: true,
      message: '密码已成功更新'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取系统设置
 */
function getSettings(req, res, next) {
  try {
    const settings = adminModel.getSettings();
    
    // 将设置限制为仅返回模型名称
    const safeSettings = {
      openaiModel: settings.openaiModel || config.openai.model
    };
    
    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新系统设置 - 仅允许更新模型
 */
function updateSettings(req, res, next) {
  try {
    const { openaiModel } = req.body;
    
    // 只更新模型设置，忽略其他设置
    const newSettings = {
      openaiModel: openaiModel || config.openai.model
    };
    
    // 更新设置
    const updatedSettings = adminModel.updateSettings(newSettings);
    logger.info('系统设置已更新', {
      model: updatedSettings.openaiModel
    });
    
    // 强制刷新OpenAI实例
    refreshOpenAIInstance();
    logger.info('OpenAI实例已刷新');
    
    // 返回安全的设置数据
    const safeSettings = {
      openaiModel: updatedSettings.openaiModel
    };
    
    res.json({
      success: true,
      message: '设置已成功更新',
      data: safeSettings
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取所有API密钥
 */
function getAllApiKeys(req, res, next) {
  try {
    const keys = apiKeyModel.getAllKeys();
    
    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 创建新的API密钥
 */
function createApiKey(req, res, next) {
  try {
    const { name, expiresAt } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: name'
      });
    }
    
    const keyData = apiKeyModel.generateKey(name, expiresAt);
    logger.info('创建了新的API密钥', { name, keyID: keyData.id });
    
    res.json({
      success: true,
      message: 'API密钥已成功创建',
      data: keyData
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除API密钥
 */
function deleteApiKey(req, res, next) {
  try {
    const { id } = req.params;
    
    const success = apiKeyModel.deleteKey(id);
    
    if (!success) {
      logger.warn('尝试删除不存在的API密钥', { keyID: id });
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${id} 的API密钥`
      });
    }
    
    logger.info('API密钥已删除', { keyID: id });
    
    res.json({
      success: true,
      message: 'API密钥已成功删除'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  changePassword,
  getSettings,
  updateSettings,
  getAllApiKeys,
  createApiKey,
  deleteApiKey
};