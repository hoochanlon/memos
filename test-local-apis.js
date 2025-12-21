// 测试本地环境下的API调用情况
const https = require('https');

// 测试的URL
const testUrl = 'https://www.pdfgear.com';

// 模拟fetch函数
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        res.json = () => Promise.resolve(JSON.parse(data));
        resolve(res);
      });
    });
    
    req.on('error', reject);
    
    // 设置超时
    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    }
    
    req.end();
  });
}

// 模拟四个API的调用
async function testApis() {
  console.log(`测试URL: ${testUrl}`);
  console.log('====================================');

  // 测试Microlink API
  console.log('1. 测试 Microlink API:');
  try {
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(testUrl)}&data=title,description`;
    const microlinkResponse = await fetch(microlinkUrl, { timeout: 8000 });
    const microlinkData = await microlinkResponse.json();
    console.log('   状态:', microlinkResponse.statusCode || microlinkResponse.status);
    console.log('   响应结构:', microlinkData.status || 'unknown');
    if (microlinkData.status === 'success' && microlinkData.data) {
      console.log('   有title:', !!microlinkData.data.title);
      console.log('   有description:', !!microlinkData.data.description);
      if (microlinkData.data.title) {
        console.log('   title:', microlinkData.data.title.substring(0, 50) + '...');
      }
      if (microlinkData.data.description) {
        console.log('   description:', microlinkData.data.description.substring(0, 50) + '...');
      }
    } else {
      console.log('   错误信息:', microlinkData.message || microlinkData.code || '未知错误');
    }
  } catch (error) {
    console.log('   错误:', error.message);
  }
  console.log();

  // 测试Ahfi API
  console.log('2. 测试 Ahfi API:');
  try {
    const ahfiUrl = `https://api.ahfi.cn/api/websiteinfo?url=${encodeURIComponent(testUrl)}`;
    const ahfiResponse = await fetch(ahfiUrl, { timeout: 8000 });
    const ahfiData = await ahfiResponse.json();
    console.log('   状态:', ahfiResponse.statusCode || ahfiResponse.status);
    console.log('   响应code:', ahfiData.code);
    if (ahfiData.code === 200 && ahfiData.data) {
      console.log('   有title:', !!ahfiData.data.title);
      console.log('   有description:', !!ahfiData.data.description);
      if (ahfiData.data.title) {
        console.log('   title:', ahfiData.data.title.substring(0, 50) + '...');
      }
      if (ahfiData.data.description) {
        console.log('   description:', ahfiData.data.description.substring(0, 50) + '...');
      }
    } else {
      console.log('   错误信息:', ahfiData.message || '未知错误');
    }
  } catch (error) {
    console.log('   错误:', error.message);
  }
  console.log();

  // 测试Xxapi API
  console.log('3. 测试 Xxapi API:');
  try {
    const xxapiUrl = `https://v2.xxapi.cn/api/tdk?url=${encodeURIComponent(testUrl)}`;
    const xxapiResponse = await fetch(xxapiUrl, { timeout: 8000 });
    const xxapiData = await xxapiResponse.json();
    console.log('   状态:', xxapiResponse.statusCode || xxapiResponse.status);
    console.log('   响应code:', xxapiData.code);
    if (xxapiData.code === 200 && xxapiData.data) {
      console.log('   有title:', !!xxapiData.data.title);
      console.log('   有description:', !!xxapiData.data.description);
      if (xxapiData.data.title) {
        console.log('   title:', xxapiData.data.title.substring(0, 50) + '...');
      }
      if (xxapiData.data.description) {
        console.log('   description:', xxapiData.data.description.substring(0, 50) + '...');
      }
    } else {
      console.log('   错误信息:', xxapiData.message || '未知错误');
    }
  } catch (error) {
    console.log('   错误:', error.message);
  }
  console.log();

  // 测试Jxcxin API
  console.log('4. 测试 Jxcxin API:');
  try {
    const jxcxinUrl = `https://apis.jxcxin.cn/api/title?url=${encodeURIComponent(testUrl)}`;
    const jxcxinResponse = await fetch(jxcxinUrl, { timeout: 8000 });
    const jxcxinData = await jxcxinResponse.json();
    console.log('   状态:', jxcxinResponse.statusCode || jxcxinResponse.status);
    console.log('   响应code:', jxcxinData.code);
    if (jxcxinData.code === 200 && jxcxinData.data) {
      console.log('   有title:', !!jxcxinData.data.title);
      console.log('   有description:', !!jxcxinData.data.description);
      if (jxcxinData.data.title) {
        console.log('   title:', jxcxinData.data.title.substring(0, 50) + '...');
      }
      if (jxcxinData.data.description) {
        console.log('   description:', jxcxinData.data.description.substring(0, 50) + '...');
      }
    } else {
      console.log('   错误信息:', jxcxinData.message || '未知错误');
    }
  } catch (error) {
    console.log('   错误:', error.message);
  }
  console.log('====================================');
  console.log('测试完成');
}

testApis();
