const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const config = require('../config/default');

// 数据文件路径
const dataDir = path.join(__dirname, '../data');
const adminFile = path.join(dataDir, 'admin.json');
const settingsFile = path.join(dataDir, 'settings.json');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化管理员数据
function initAdmin() {
  if (!fs.existsSync(adminFile)) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(config.admin.password, salt);
    
    const adminData = {
      username: config.admin.username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(adminFile, JSON.stringify(adminData, null, 2));
    return adminData;
  }
  
  return JSON.parse(fs.readFileSync(adminFile, 'utf8'));
}

// 初始化设置数据
function initSettings() {
  if (!fs.existsSync(settingsFile)) {
    const settingsData = {
      openaiApiKey: config.openai.apiKey,
      openaiBaseUrl: config.openai.baseURL,
      openaiModel: config.openai.model,
      port: config.server.port,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(settingsFile, JSON.stringify(settingsData, null, 2));
    return settingsData;
  }
  
  return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
}

// 初始化数据
let adminData = initAdmin();
let settingsData = initSettings();

/**
 * 验证管理员凭据
 */
function validateAdmin(username, password) {
  if (username !== adminData.username) {
    return false;
  }
  
  return bcrypt.compareSync(password, adminData.password);
}

/**
 * 更新管理员密码
 */
function updateAdminPassword(newPassword) {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);
  
  adminData.password = hashedPassword;
  adminData.updatedAt = new Date().toISOString();
  
  fs.writeFileSync(adminFile, JSON.stringify(adminData, null, 2));
  return true;
}

/**
 * 获取设置
 */
function getSettings() {
  return settingsData;
}

/**
 * 更新设置
 */
function updateSettings(newSettings) {
  // 合并设置
  settingsData = {
    ...settingsData,
    ...newSettings,
    updatedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(settingsFile, JSON.stringify(settingsData, null, 2));
  return settingsData;
}

module.exports = {
  validateAdmin,
  updateAdminPassword,
  getSettings,
  updateSettings
};