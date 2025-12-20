// 测试本地环境下的API调用情况
const https = require('https');

// 测试的URL
const testUrl = 'https://duckduckgo.com/';

// 模拟fetch函数
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(testUrl)}&fields=description`;
    const microlinkResponse = await fetch(microlinkUrl, { timeout: 5000 });
    const microlinkData = await microlinkResponse.json();
    console.log('   状态:', microlinkResponse.status);
    console.log('   有description:', !!microlinkData.data?.description);
    if (microlinkData.data?.description) {
      console.log('   description:', microlinkData.data.description.substring(0, 50) + '...');
    }
  } catch (error) {
    console.log('   错误:', error.message);
  }
  console.log();

  // 测试Ahfi API
  console.log('2. 测试 Ahfi API:');
  try {
    const ahfiUrl = `https://api.ahfi.cn/api/websiteinfo?url=${encodeURIComponent(testUrl)}`;
    const ahfiResponse = await fetch(ahfiUrl, { timeout: 5000 });
    const ahfiData = await ahfiResponse.json();
    console.log('   状态:', ahfiResponse.status);
    console.log('   有description:', !!ahfiData.data?.description);
    if (ahfiData.data?.description) {
      console.log('   description:', ahfiData.data.description.substring(0, 50) + '...');
    }
  } catch (error) {
    console.log('   错误:', error.message);
  }
  console.log();

  // 测试Xxapi API
  console.log('3. 测试 Xxapi API:');
  try {
    const xxapiUrl = `https://v2.xxapi.cn/api/tdk?url=${encodeURIComponent(testUrl)}`;
    const xxapiResponse = await fetch(xxapiUrl, { timeout: 5000 });
    const xxapiData = await xxapiResponse.json();
    console.log('   状态:', xxapiResponse.status);
    console.log('   有description:', !!xxapiData.data?.description);
    if (xxapiData.data?.description) {
      console.log('   description:', xxapiData.data.description.substring(0, 50) + '...');
    }
  } catch (error) {
    console.log('   错误:', error.message);
  }
  console.log();

  // 测试Jxcxin API
  console.log('4. 测试 Jxcxin API:');
  try {
    const jxcxinUrl = `https://apis.jxcxin.cn/api/title?url=${encodeURIComponent(testUrl)}`;
    const jxcxinResponse = await fetch(jxcxinUrl, { timeout: 5000 });
    const jxcxinData = await jxcxinResponse.json();
    console.log('   状态:', jxcxinResponse.status);
    console.log('   有description:', !!jxcxinData.data?.description);
    if (jxcxinData.data?.description) {
      console.log('   description:', jxcxinData.data.description.substring(0, 50) + '...');
    }
  } catch (error) {
    console.log('   错误:', error.message);
  }
  console.log('====================================');
  console.log('测试完成');
}

testApis();
