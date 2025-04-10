const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config/default');

// 配置文件存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    // 使用时间戳+原始文件名以避免文件名冲突
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExt);
  }
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedFileTypes;
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}。支持的类型: ${allowedTypes.join(', ')}`), false);
  }
};

// 创建上传中间件
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize // 文件大小限制
  },
  fileFilter: fileFilter
});

// 删除临时文件
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`删除文件失败: ${filePath}`, error);
  }
}

// 获取文件类型
function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // 音频文件
  if (['.mp3', '.wav', '.m4a', '.ogg', '.mp4'].includes(ext)) {
    return 'audio';
  }
  
  // 文本和文档文件
  if (['.txt', '.md', '.doc', '.docx', '.rtf'].includes(ext)) {
    return 'document';
  }
  
  // 表格文件
  if (['.csv', '.xls', '.xlsx', '.json'].includes(ext)) {
    return 'table';
  }
  
  // 默认为普通文本
  return 'text';
}

module.exports = {
  upload,
  deleteFile,
  getFileType
};