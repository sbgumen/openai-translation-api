const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 数据文件路径
const dataDir = path.join(__dirname, '../data');
const apiKeysFile = path.join(dataDir, 'apiKeys.json');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化API密钥数据
function initApiKeys() {
  if (!fs.existsSync(apiKeysFile)) {
    fs.writeFileSync(apiKeysFile, JSON.stringify([], null, 2));
    return [];
  }
  
  return JSON.parse(fs.readFileSync(apiKeysFile, 'utf8'));
}

// 加载API密钥数据
let apiKeys = initApiKeys();

/**
 * 生成新的API密钥
 */
function generateKey(name, expiresAt = null) {
  const apiKey = uuidv4();
  
  const keyData = {
    id: uuidv4(),
    name: name,
    key: apiKey,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt,
    lastUsed: null,
    usageCount: 0
  };
  
  apiKeys.push(keyData);
  saveApiKeys();
  
  return keyData;
}

/**
 * 保存API密钥数据到文件
 */
function saveApiKeys() {
  fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeys, null, 2));
}

/**
 * 验证API密钥
 */
function validateKey(apiKey) {
  const now = new Date();
  
  const keyData = apiKeys.find(k => k.key === apiKey);
  
  if (!keyData) {
    return null;
  }
  
  // 检查是否过期
  if (keyData.expiresAt && new Date(keyData.expiresAt) < now) {
    return null;
  }
  
  // 更新使用记录
  keyData.lastUsed = now.toISOString();
  keyData.usageCount++;
  
  saveApiKeys();
  
  return keyData;
}

/**
 * 获取所有API密钥
 */
function getAllKeys() {
  return apiKeys.map(key => ({
    id: key.id,
    name: key.name,
    key: key.key.substring(0, 8) + '...',
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    lastUsed: key.lastUsed,
    usageCount: key.usageCount
  }));
}

/**
 * 删除API密钥
 */
function deleteKey(keyId) {
  const initialLength = apiKeys.length;
  apiKeys = apiKeys.filter(key => key.id !== keyId);
  
  if (apiKeys.length < initialLength) {
    saveApiKeys();
    return true;
  }
  
  return false;
}

module.exports = {
  generateKey,
  validateKey,
  getAllKeys,
  deleteKey
};