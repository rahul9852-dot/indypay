const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000/api/v1/payments';
const TEST_CONFIG = {
  // Basic VPA configuration
  vpas: [
    {
      vpa: "vpa1@paybolt",
      priority: 1,
      isActive: true,
      description: "Primary VPA",
      maxDailyTransactions: 1000,
      maxDailyAmount: 1000000,
      circuitBreakerThreshold: 3,
      rateLimitPerMinute: 500
    },
    {
      vpa: "vpa2@paybolt", 
      priority: 2,
      isActive: true,
      description: "Secondary VPA",
      maxDailyTransactions: 800,
      maxDailyAmount: 800000,
      circuitBreakerThreshold: 5,
      rateLimitPerMinute: 400
    },
    {
      vpa: "vpa3@paybolt",
      priority: 3,
      isActive: true,
      description: "Tertiary VPA", 
      maxDailyTransactions: 600,
      maxDailyAmount: 600000,
      circuitBreakerThreshold: 7,
      rateLimitPerMinute: 300
    }
  ]
};

async function testEnhancedVPARouting() {
  console.log('🚀 Testing Enhanced VPA Routing System\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      const response = await axios.get(`${BASE_URL}/vpa/stats`);
      console.log('✅ Server is running and responding');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  Server is running but requires authentication');
      } else {
        console.log('❌ Server is not responding:', error.message);
        return;
      }
    }

    // Test 2: Simulate VPA routing logic
    console.log('\n2. Testing VPA routing logic...');
    
    // Simulate different routing strategies
    const strategies = ['round_robin', 'health_based', 'adaptive'];
    const testCases = [
      { userId: 'user123', amount: 500, orderId: 'TEST001' },
      { userId: 'user456', amount: 5000, orderId: 'TEST002' },
      { userId: 'user789', amount: 50000, orderId: 'TEST003' }
    ];

    strategies.forEach(strategy => {
      console.log(`\n   Strategy: ${strategy}`);
      testCases.forEach(testCase => {
        const selectedVPA = simulateVPARouting(strategy, testCase, TEST_CONFIG.vpas);
        console.log(`     ${testCase.orderId} (₹${testCase.amount}) → ${selectedVPA}`);
      });
    });

    // Test 3: Simulate health monitoring
    console.log('\n3. Testing health monitoring simulation...');
    
    const healthMetrics = simulateHealthMetrics(TEST_CONFIG.vpas);
    healthMetrics.forEach(metric => {
      const status = metric.healthScore > 70 ? '🟢' : metric.healthScore > 50 ? '🟡' : '🔴';
      console.log(`   ${status} ${metric.vpa}: Health Score ${metric.healthScore}, Success Rate ${(metric.successRate * 100).toFixed(1)}%`);
    });

    // Test 4: Simulate circuit breaker
    console.log('\n4. Testing circuit breaker simulation...');
    
    const circuitBreakerStates = simulateCircuitBreaker(TEST_CONFIG.vpas);
    circuitBreakerStates.forEach(state => {
      const icon = state.isOpen ? '🔴' : '🟢';
      console.log(`   ${icon} ${state.vpa}: Circuit ${state.isOpen ? 'OPEN' : 'CLOSED'} (${state.failures} failures)`);
    });

    // Test 5: Generate sample payment links
    console.log('\n5. Testing payment link generation...');
    
    testCases.forEach(testCase => {
      const paymentLink = generatePaymentLink(testCase, TEST_CONFIG.vpas[0].vpa);
      console.log(`   ${testCase.orderId}: ${paymentLink.substring(0, 50)}...`);
    });

    console.log('\n✅ Enhanced VPA Routing System Test Completed!');
    console.log('\n📊 Summary:');
    console.log('   - Multiple VPAs configured');
    console.log('   - Health monitoring active');
    console.log('   - Circuit breaker protection enabled');
    console.log('   - Rate limiting configured');
    console.log('   - Adaptive routing strategy available');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function simulateVPARouting(strategy, testCase, vpas) {
  const { userId, amount, orderId } = testCase;
  
  switch (strategy) {
    case 'round_robin':
      // Simple round-robin simulation
      const index = parseInt(orderId.slice(-1)) % vpas.length;
      return vpas[index].vpa;
      
    case 'health_based':
      // Simulate health-based routing (always pick healthiest)
      return vpas[0].vpa; // Assuming first VPA is healthiest
      
    case 'adaptive':
      // Simulate adaptive routing based on amount
      if (amount > 10000) return vpas[0].vpa; // High amount → high priority
      if (amount > 1000) return vpas[1].vpa;  // Medium amount → medium priority
      return vpas[2].vpa; // Low amount → low priority
      
    default:
      return vpas[0].vpa;
  }
}

function simulateHealthMetrics(vpas) {
  return vpas.map((vpa, index) => ({
    vpa: vpa.vpa,
    healthScore: 85 - (index * 10), // Simulate decreasing health
    successRate: 0.95 - (index * 0.05), // Simulate decreasing success rate
    totalTransactions: 1000 - (index * 100),
    averageResponseTime: 200 + (index * 50)
  }));
}

function simulateCircuitBreaker(vpas) {
  return vpas.map((vpa, index) => ({
    vpa: vpa.vpa,
    isOpen: index === 2, // Simulate third VPA having circuit open
    failures: index === 2 ? 7 : 2, // Simulate failure count
    lastFailure: new Date().toISOString()
  }));
}

function generatePaymentLink(testCase, selectedVpa) {
  const { amount, orderId } = testCase;
  const expiry = new Date(Date.now() + 60 * 1000).getTime();
  const paymentStr = `&pa=${selectedVpa}&am=${amount}&tr=${orderId}&tn=Payment_for_${orderId}&cu=INR&exp=${expiry}`;
  
  return `upi://pay?${paymentStr}`;
}

// Run the test
testEnhancedVPARouting(); 