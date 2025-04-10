/**
 * API密钥生成器工具
 */
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * 生成UUID格式的API密钥
 * @returns {string} 生成的API密钥
 */
function generateUuidKey() {
  return uuidv4();
}

/**
 * 生成指定长度的随机字符串API密钥
 * @param {number} length - 密钥长度
 * @param {string} prefix - 密钥前缀，默认为'sk-'
 * @returns {string} 生成的API密钥
 */
function generateRandomKey(length = 24, prefix = 'sk-') {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = crypto.randomBytes(length);
  
  let result = prefix;
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % characters.length;
    result += characters.charAt(randomIndex);
  }
  
  return result;
}

/**
 * 验证API密钥格式
 * @param {string} key - 要验证的API密钥
 * @returns {boolean} 密钥格式是否有效
 */
function validateKeyFormat(key) {
  // UUID格式验证
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // 带前缀的随机字符串格式验证
  const randomPattern = /^sk-[A-Za-z0-9]{24,}$/;
  
  return uuidPattern.test(key) || randomPattern.test(key);
}

module.exports = {
  generateUuidKey,
  generateRandomKey,
  validateKeyFormat
};