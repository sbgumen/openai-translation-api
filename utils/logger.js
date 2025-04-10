/**
 * 日志工具
 * 用于统一的日志记录和格式化
 */
const fs = require('fs');
const path = require('path');

// 日志级别
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// 当前环境的日志级别
const currentLevel = process.env.LOG_LEVEL || LOG_LEVELS.INFO;

// 日志目录
const logDir = path.join(__dirname, '../logs');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志文件路径
const logFilePath = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);

/**
 * 格式化日志消息
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} [meta] - 附加元数据
 * @returns {string} 格式化的日志消息
 */
function formatLogMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (Object.keys(meta).length > 0) {
    formattedMessage += ` ${JSON.stringify(meta)}`;
  }
  
  return formattedMessage;
}

/**
 * 写入日志到控制台和文件
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} [meta] - 附加元数据
 */
function writeLog(level, message, meta = {}) {
  const levels = Object.values(LOG_LEVELS);
  const currentLevelIndex = levels.indexOf(currentLevel);
  const messageLevelIndex = levels.indexOf(level);
  
  // 只记录当前级别及以上的日志
  if (messageLevelIndex <= currentLevelIndex) {
    const formattedMessage = formatLogMessage(level, message, meta);
    
    // 控制台输出
    if (level === LOG_LEVELS.ERROR) {
      console.error(formattedMessage);
    } else if (level === LOG_LEVELS.WARN) {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
    
    // 文件输出
    try {
      fs.appendFileSync(logFilePath, formattedMessage + '\n');
    } catch (err) {
      console.error(`无法写入日志文件: ${err.message}`);
    }
  }
}

/**
 * 记录错误日志
 * @param {string} message - 日志消息
 * @param {Object} [meta] - 附加元数据
 */
function error(message, meta = {}) {
  writeLog(LOG_LEVELS.ERROR, message, meta);
}

/**
 * 记录警告日志
 * @param {string} message - 日志消息
 * @param {Object} [meta] - 附加元数据
 */
function warn(message, meta = {}) {
  writeLog(LOG_LEVELS.WARN, message, meta);
}

/**
 * 记录信息日志
 * @param {string} message - 日志消息
 * @param {Object} [meta] - 附加元数据
 */
function info(message, meta = {}) {
  writeLog(LOG_LEVELS.INFO, message, meta);
}

/**
 * 记录调试日志
 * @param {string} message - 日志消息
 * @param {Object} [meta] - 附加元数据
 */
function debug(message, meta = {}) {
  writeLog(LOG_LEVELS.DEBUG, message, meta);
}

/**
 * 记录API请求日志
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // 记录请求开始
  info(`API请求开始: ${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // 响应完成时记录
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    const logMethod = logLevel === 'error' ? error : info;
    logMethod(`API请求完成: ${req.method} ${req.originalUrl}`, {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
}

module.exports = {
  LOG_LEVELS,
  error,
  warn,
  info,
  debug,
  requestLogger
};