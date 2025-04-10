const { OpenAI } = require('openai');
const config = require('../config/default');
const adminModel = require('../models/admin');
const logger = require('../utils/logger');

// OpenAI实例缓存
let openaiInstance = null;
let lastConfigUpdate = null;

// 获取最新的 OpenAI 配置
function getOpenAIInstance() {
  try {
    // 尝试从数据库获取最新配置
    const settings = adminModel.getSettings();
    const currentTime = new Date().getTime();
    
    // 检查配置是否已更新或者实例是否存在
    if (!openaiInstance || !lastConfigUpdate || 
        settings.updatedAt && new Date(settings.updatedAt).getTime() > lastConfigUpdate) {
      
      // 记录配置信息
      logger.info('初始化OpenAI实例', {
        baseURL: settings.openaiBaseUrl || config.openai.baseURL,
        model: settings.openaiModel || config.openai.model,
        apiKeyLength: (settings.openaiApiKey || config.openai.apiKey || '').length
      });
      
      // 创建新的OpenAI实例
      openaiInstance = new OpenAI({
        apiKey: settings.openaiApiKey || config.openai.apiKey,
        baseURL: settings.openaiBaseUrl || config.openai.baseURL,
        timeout: 30000, // 30秒超时
        maxRetries: 2    // 最多重试2次
      });
      
      // 更新最后配置时间
      lastConfigUpdate = currentTime;
    }
    
    return openaiInstance;
  } catch (error) {
    // 如果数据库还没有初始化或出错，使用默认配置
    logger.warn('获取OpenAI配置失败，使用默认配置', { error: error.message });
    
    if (!openaiInstance) {
      openaiInstance = new OpenAI({
        apiKey: config.openai.apiKey,
        baseURL: config.openai.baseURL,
        timeout: 30000,
        maxRetries: 2
      });
      lastConfigUpdate = new Date().getTime();
    }
    
    return openaiInstance;
  }
}

// 强制刷新OpenAI实例
function refreshOpenAIInstance() {
  openaiInstance = null;
  lastConfigUpdate = null;
  return getOpenAIInstance();
}

module.exports = {
  getOpenAIInstance,
  refreshOpenAIInstance
};