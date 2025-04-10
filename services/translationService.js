const fs = require('fs');
const path = require('path');
const config = require('../config/default');
const { getOpenAIInstance, refreshOpenAIInstance } = require('./openai');
const logger = require('../utils/logger');

// 重试功能封装
async function withRetry(operation, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 如果不是第一次尝试且上一次错误是认证错误，则刷新OpenAI实例
      if (attempt > 0 && lastError && lastError.status === 401) {
        logger.warn('检测到认证错误，刷新OpenAI实例后重试', { attempt });
        refreshOpenAIInstance();
      }
      
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 记录错误
      logger.error(`操作失败 (尝试 ${attempt + 1}/${maxRetries + 1})`, { 
        error: error.message,
        status: error.status,
        type: error.type
      });
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 等待一段时间后重试
      const delay = Math.pow(2, attempt) * 1000; // 指数退避策略
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 文本翻译
async function translateText(text, sourceLanguage, targetLanguage) {
  try {
    return await withRetry(async () => {
      const openai = getOpenAIInstance();
      const settings = require('../models/admin').getSettings();
      const model = settings.openaiModel || config.openai.model;
      
      logger.info('开始文本翻译', { 
        textLength: text.length,
        sourceLanguage,
        targetLanguage,
        model
      });
      
      const prompt = `将以下${sourceLanguage}文本翻译成${targetLanguage}:\n\n${text}`;
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: '你是一个专业的翻译助手，只进行文本翻译，不添加任何解释或额外内容。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature
      });
      
      logger.info('文本翻译完成', {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0
      });
      
      return {
        translatedText: response.choices[0].message.content.trim(),
        usage: response.usage
      };
    });
  } catch (error) {
    logger.error('翻译文本错误:', error);
    throw new Error(`翻译失败: ${error.message}`);
  }
}

// 优化的表格翻译 - 处理多种表格格式
async function translateTable(table, sourceLanguage, targetLanguage) {
  try {
    return await withRetry(async () => {
      const openai = getOpenAIInstance();
      const settings = require('../models/admin').getSettings();
      const model = settings.openaiModel || config.openai.model;
      
      // 表格类型检测和预处理
      let tableType = 'unknown';
      let tableData = table;
      let promptTemplate = '';
      
      // 检测表格类型并格式化
      if (Array.isArray(table)) {
        if (table.length > 0) {
          if (Array.isArray(table[0])) {
            // 二维数组格式 [[],[],...]
            tableType = 'array2d';
            
            // 提取表头（如果存在）
            const hasHeaders = typeof table[0][0] === 'string';
            
            // 为二维数组构建特殊提示词
            promptTemplate = `这是一个二维数组表格数据，${hasHeaders ? '第一行为表头' : '没有表头'}。请翻译所有${sourceLanguage}文本为${targetLanguage}，保持数组结构不变。`;
          } else if (typeof table[0] === 'object') {
            // 对象数组格式 [{},{},...]
            tableType = 'arrayOfObjects';
            
            // 提取字段名
            const fields = Object.keys(table[0]).join(', ');
            
            promptTemplate = `这是一个对象数组，每个对象有以下字段: ${fields}。请翻译所有${sourceLanguage}文本为${targetLanguage}，包括字段值，但不要翻译字段名。保持JSON结构完全不变。`;
          }
        } else {
          // 空数组
          tableType = 'emptyArray';
          return { translatedTable: [], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
        }
      } else if (typeof table === 'object' && table !== null) {
        // 嵌套对象格式
        tableType = 'nestedObject';
        
        promptTemplate = `这是一个嵌套的对象结构。请翻译所有${sourceLanguage}文本值为${targetLanguage}，保持对象的键名和结构不变。`;
      }
      
      // 将表格转换为JSON字符串
      const tableJson = JSON.stringify(tableData, null, 2);
      
      logger.info('开始表格翻译', { 
        tableSize: tableJson.length,
        tableType: tableType,
        sourceLanguage,
        targetLanguage,
        model
      });
      
      const prompt = `${promptTemplate}

请将以下${sourceLanguage}表格数据翻译成${targetLanguage}。
表格数据是JSON格式：
\`\`\`json
${tableJson}
\`\`\`

请保持相同的JSON结构，返回完整的JSON数据，只翻译值部分，保持键名不变。请确保返回的数据是有效的JSON格式，不要添加任何额外的输出。`;
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: '你是一个专业的表格翻译助手，只翻译表格内容，保持原始JSON结构完全不变。确保输出的数据是有效的JSON格式。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: 0.1  // 降低温度，提高结构准确性
      });
      
      // 从响应中提取JSON
      let responseContent = response.choices[0].message.content.trim();
      
      // 如果返回了代码块，提取其中的JSON
      if (responseContent.includes('```json')) {
        responseContent = responseContent.split('```json')[1].split('```')[0].trim();
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.split('```')[1].split('```')[0].trim();
      }
      
      try {
        // 尝试解析返回的JSON
        const translatedTable = JSON.parse(responseContent);
        
        logger.info('表格翻译完成', {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          tableType: tableType
        });
        
        return {
          translatedTable,
          usage: response.usage
        };
      } catch (parseError) {
        logger.warn('表格翻译响应解析失败', { 
          error: parseError.message,
          responseStart: responseContent.substring(0, 100) + '...'
        });
        
        // 尝试修复常见的JSON解析错误
        try {
          // 尝试添加缺失的引号
          let fixedJson = responseContent.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
          const translatedTable = JSON.parse(fixedJson);
          
          logger.info('修复后的JSON解析成功', {
            tableType: tableType
          });
          
          return {
            translatedTable,
            usage: response.usage
          };
        } catch (fixError) {
          // 如果修复尝试失败，返回原始响应
          logger.error('JSON修复失败', { error: fixError.message });
          
          return {
            translatedText: responseContent,
            usage: response.usage
          };
        }
      }
    });
  } catch (error) {
    logger.error('翻译表格错误:', error);
    throw new Error(`翻译表格失败: ${error.message}`);
  }
}

// 文档翻译
async function translateDocument(filePath, sourceLanguage, targetLanguage) {
  try {
    logger.info('开始文档翻译', { 
      filePath: path.basename(filePath),
      fileSize: fs.statSync(filePath).size,
      sourceLanguage,
      targetLanguage
    });
    
    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 根据文件类型处理内容
    const fileExtension = path.extname(filePath).toLowerCase();
    
    let result;
    
    if (['.json', '.csv'].includes(fileExtension)) {
      // 对于JSON和CSV文件，尝试解析为表格
      try {
        const data = JSON.parse(fileContent);
        result = await translateTable(data, sourceLanguage, targetLanguage);
      } catch (parseError) {
        logger.warn('文件解析为JSON失败，转为文本翻译', { 
          error: parseError.message,
          extension: fileExtension
        });
        // 如果解析失败，当作普通文本处理
        result = await translateText(fileContent, sourceLanguage, targetLanguage);
      }
    } else {
      // 其他文件类型当作普通文本处理
      result = await translateText(fileContent, sourceLanguage, targetLanguage);
    }
    
    logger.info('文档翻译完成', { 
      filePath: path.basename(filePath),
      resultSize: JSON.stringify(result).length
    });
    
    return result;
  } catch (error) {
    logger.error('翻译文档错误:', error);
    throw new Error(`翻译文档失败: ${error.message}`);
  }
}

// 音频翻译
async function translateAudio(filePath, sourceLanguage, targetLanguage) {
  try {
    return await withRetry(async () => {
      const openai = getOpenAIInstance();
      
      logger.info('开始音频翻译', { 
        filePath: path.basename(filePath),
        fileSize: fs.statSync(filePath).size,
        sourceLanguage,
        targetLanguage
      });
      
      // 使用OpenAI的Whisper API将音频转录为文本
      const transcriptionResponse = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        language: sourceLanguage === '中文' ? 'zh' : 
                sourceLanguage === '英文' ? 'en' : 
                sourceLanguage.toLowerCase()
      });
      
      // 获取转录文本
      const transcribedText = transcriptionResponse.text;
      
      logger.info('音频转录完成', { textLength: transcribedText.length });
      
      // 翻译转录的文本
      const translationResult = await translateText(transcribedText, sourceLanguage, targetLanguage);
      
      logger.info('音频翻译完成');
      
      return {
        originalText: transcribedText,
        translatedText: translationResult.translatedText,
        usage: {
          transcription: {
            seconds: Math.ceil(fs.statSync(filePath).size / (16000 * 2))  // 粗略估计音频长度
          },
          translation: translationResult.usage
        }
      };
    });
  } catch (error) {
    logger.error('翻译音频错误:', error);
    throw new Error(`翻译音频失败: ${error.message}`);
  }
}

module.exports = {
  translateText,
  translateTable,
  translateDocument,
  translateAudio
};