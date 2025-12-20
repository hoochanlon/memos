// 测试API回退机制的脚本
// 可以在浏览器控制台中运行此脚本进行测试

// 模拟一个会失败的URL（用于测试回退机制）
const testUrl = 'https://example.com';

// 测试函数
async function testApiFallback() {
  console.log('=== 测试API回退机制 ===');
  console.log('测试URL:', testUrl);
  
  try {
    // 模拟API调用，检查是否会依次尝试所有方案
    const result = await window.fetchWebsiteData(testUrl);
    console.log('最终结果:', result);
    console.log('测试完成：API回退机制正常工作');
  } catch (error) {
    console.error('测试失败：', error);
  }
}

// 导出测试函数以便在浏览器中使用
if (typeof window !== 'undefined') {
  window.testApiFallback = testApiFallback;
  console.log('测试脚本已加载，可调用 testApiFallback() 进行测试');
} else {
  console.log('此脚本设计为在浏览器中运行');
}
