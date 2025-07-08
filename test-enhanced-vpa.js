const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1/payments';
const API_KEY = 'your-api-key-here'; // Replace with your actual API key

// Test data
const testTransactions = [
  {
    orderId: 'test-order-001',
    vpa: 'getepay.usfbqrap259707@utkarshbank',
    amount: 100,
    status: 'SUCCESS',
    responseTime: 2500
  },
  {
    orderId: 'test-order-002',
    vpa: 'getepay.usfbqrap259707@utkarshbank',
    amount: 200,
    status: 'SUCCESS',
    responseTime: 1800
  },
  {
    orderId: 'test-order-003',
    vpa: 'getepay.usfbqrap259707@utkarshbank',
    amount: 150,
    status: 'FAILED',
    responseTime: 5000
  }
];

async function testVPAMetrics() {
  console.log('🚀 Starting VPA Metrics Test...\n');

  try {
    // 1. Get initial stats
    console.log('📊 Getting initial VPA stats...');
    const initialStats = await axios.get(`${BASE_URL}/vpa/stats`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('Initial stats:', JSON.stringify(initialStats.data, null, 2));

    // 2. Test each transaction
    for (const transaction of testTransactions) {
      console.log(`\n🔄 Testing transaction: ${transaction.orderId}`);
      
      const result = await axios.post(`${BASE_URL}/vpa/test-transaction`, transaction, {
        headers: { 'x-api-key': API_KEY }
      });
      
      console.log(`Transaction result:`, JSON.stringify(result.data, null, 2));
      
      // Wait a bit between transactions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Get final stats
    console.log('\n📊 Getting final VPA stats...');
    const finalStats = await axios.get(`${BASE_URL}/vpa/stats`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('Final stats:', JSON.stringify(finalStats.data, null, 2));

    // 4. Debug metrics
    console.log('\n🔍 Debugging metrics...');
    const debugResult = await axios.get(`${BASE_URL}/vpa/debug-metrics`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('Debug result:', JSON.stringify(debugResult.data, null, 2));

    console.log('\n✅ VPA Metrics Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testVPAMetrics(); 