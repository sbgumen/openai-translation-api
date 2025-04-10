const path = require('path');
const logger = require('../utils/logger');
const { 
  translateText, 
  translateTable, 
  translateDocument, 
  translateAudio 
} = require('../services/translationService');
const { deleteFile, getFileType } = require('../services/fileService');

/**
 * 文本翻译控制器
 */
async function translateTextController(req, res, next) {
  try {
    logger.info('文本翻译请求', { 
      contentLength: req.body?.text?.length || 0,
      sourceLanguage: req.body?.sourceLanguage,
      targetLanguage: req.body?.targetLanguage
    });
    
    const { text, sourceLanguage, targetLanguage } = req.body;
    
    // 验证必需参数
    if (!text) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: text'
      });
    }
    
    // 默认语言
    const source = sourceLanguage || '中文';
    const target = targetLanguage || '英文';
    
    // 添加超时保护
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('翻译请求超时，可能是文本过长或服务器负载过高'));
      }, 60000); // 60秒超时
    });
    
    // 调用翻译服务
    const translationPromise = translateText(text, source, target);
    
    // 使用Promise.race进行超时处理
    const result = await Promise.race([translationPromise, timeoutPromise]);
    
    // 返回结果
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('文本翻译错误', { error: error.message, stack: error.stack });
    next(error);
  }
}

/**
 * 表格翻译控制器
 */
async function translateTableController(req, res, next) {
  try {
    logger.info('表格翻译请求', { 
      tableSize: req.body?.table ? JSON.stringify(req.body.table).length : 0,
      sourceLanguage: req.body?.sourceLanguage,
      targetLanguage: req.body?.targetLanguage
    });
    
    const { table, sourceLanguage, targetLanguage } = req.body;
    
    // 验证必需参数
    if (!table) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: table'
      });
    }
    
    // 默认语言
    const source = sourceLanguage || '中文';
    const target = targetLanguage || '英文';
    
    // 添加超时保护
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('翻译请求超时，可能是表格过大或服务器负载过高'));
      }, 120000); // 120秒超时
    });
    
    // 调用翻译服务
    const translationPromise = translateTable(table, source, target);
    
    // 使用Promise.race进行超时处理
    const result = await Promise.race([translationPromise, timeoutPromise]);
    
    // 返回结果
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('表格翻译错误', { error: error.message, stack: error.stack });
    next(error);
  }
}

/**
 * 文件翻译控制器
 */
async function translateFileController(req, res, next) {
  let filePath = null;
  
  try {
    // 检查文件是否上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未找到上传的文件'
      });
    }
    
    filePath = req.file.path;
    
    logger.info('文件翻译请求', { 
      filename: req.file.originalname,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      sourceLanguage: req.body?.sourceLanguage,
      targetLanguage: req.body?.targetLanguage
    });
    
    const { sourceLanguage, targetLanguage } = req.body;
    
    // 默认语言
    const source = sourceLanguage || '中文';
    const target = targetLanguage || '英文';
    
    // 根据文件类型调用相应的翻译服务
    const fileType = getFileType(filePath);
    let result;
    
    // 添加超时保护
    const timeoutDuration = fileType === 'audio' ? 300000 : 180000; // 音频5分钟，其他3分钟
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`翻译请求超时，可能是文件过大或服务器负载过高`));
      }, timeoutDuration);
    });
    
    // 调用对应的翻译服务
    let translationPromise;
    
    if (fileType === 'audio') {
      translationPromise = translateAudio(filePath, source, target);
    } else if (fileType === 'table') {
      translationPromise = translateDocument(filePath, source, target);
    } else {
      translationPromise = translateDocument(filePath, source, target);
    }
    
    // 使用Promise.race进行超时处理
    result = await Promise.race([translationPromise, timeoutPromise]);
    
    // 返回结果
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('文件翻译错误', { 
      error: error.message, 
      stack: error.stack,
      file: req.file?.originalname
    });
    next(error);
  } finally {
    // 确保清理临时文件
    if (filePath) {
      try {
        deleteFile(filePath);
      } catch (deleteErr) {
        logger.warn('删除临时文件失败', { path: filePath, error: deleteErr.message });
      }
    }
  }
}

module.exports = {
  translateTextController,
  translateTableController,
  translateFileController
};