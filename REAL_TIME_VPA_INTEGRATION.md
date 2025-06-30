# Real-Time VPA Routing Integration Guide

## Overview

The enhanced VPA routing service now supports real-time metrics collection from actual payment processing. This guide explains how to integrate it with your payment flow to get accurate health scores and routing decisions.

## Key Features

✅ **Real-time metrics collection** from payment webhooks  
✅ **Historical data loading** from database  
✅ **Health score calculation** based on actual success/failure rates  
✅ **Response time tracking** from payment initiation to completion  
✅ **Circuit breaker pattern** for failing VPAs  
✅ **Rate limiting** per VPA  
✅ **Multiple routing strategies** (round-robin, health-based, adaptive)  

## Integration Points

### 1. Payment Service Integration

Update your payment service to use the enhanced VPA routing:

```typescript
// In payments.service.ts
import { enhancedVpaRoutingService } from "@/utils/enhanced-vpa-routing.util";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Set up the routing service with dependencies
    enhancedVpaRoutingService.setCacheManager(this.cacheManager);
    enhancedVpaRoutingService.setPayInOrdersRepository(this.payInOrdersRepository);
  }

  async createUtkarshPaymentLink(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
  ) {
    // ... existing code ...

    // Use enhanced VPA routing with real-time tracking
    const paymentLink = await generatePaymentLinkUtil({
      amount,
      orderId,
      userId: user.id,
    });

    // ... rest of the method ...
  }

  async externalWebhookPayinUtkarsh(
    externalWebhookPayin: ExternalPayinWebhookUtkarshDto,
  ) {
    try {
      const { txnId, txnStatus, custRef, amount, refId, uniqueId, upiTxnId } = externalWebhookPayin;
      const status = convertExternalPaymentStatusToInternal(txnStatus);

      // ... existing webhook processing ...

      // Calculate response time
      const payinOrder = await this.payInOrdersRepository.findOne({
        where: { orderId: refId },
        relations: ["user"],
      });

      let responseTime: number | undefined;
      if (payinOrder) {
        const now = new Date();
        responseTime = now.getTime() - payinOrder.createdAt.getTime();
      }

      // Update VPA metrics with real payment result
      await enhancedVpaRoutingService.processPaymentWebhook(
        refId, // orderId
        status, // PAYMENT_STATUS.SUCCESS or PAYMENT_STATUS.FAILED
        responseTime // response time in milliseconds
      );

      // ... rest of webhook processing ...
    } catch (error) {
      // ... error handling ...
    }
  }
}
```

### 2. Payment Link Utility Update

Update the payment link utility to use the enhanced routing:

```typescript
// In payment-link.util.ts
import { enhancedVpaRoutingService } from "@/utils/enhanced-vpa-routing.util";

export const generatePaymentLinkUtil = async (
  payload: IGeneratePaymentLinkPayload,
): Promise<string> => {
  const { amount, orderId, vpa, userId } = payload;
  const startTime = Date.now();

  try {
    // Use enhanced VPA routing service with real-time tracking
    const routingResult = await enhancedVpaRoutingService.selectVPA(
      userId,
      amount,
      orderId, // This enables transaction tracking
    );
    
    const selectedVpa = vpa || routingResult.selectedVpa;
    const responseTime = Date.now() - startTime;

    logger.info(`VPA Selection: ${LoggerPlaceHolder.Json}`, {
      selectedVpa,
      strategy: routingResult.strategy,
      reason: routingResult.reason,
      responseTime,
      metadata: routingResult.metadata,
    });

    const expiry = new Date(Date.now() + 60 * 1000);
    const paymentStr = `&pa=${selectedVpa}&am=${amount}&tr=${orderId}&tn=Payment_for_${orderId}&cu=INR&exp=${expiry.getTime()}`;

    return `upi://pay?${paymentStr}`;
  } catch (error) {
    logger.error(`VPA Selection Failed: ${LoggerPlaceHolder.Json}`, {
      error: error.message,
      payload,
    });

    // Fallback to default VPA
    const fallbackVpa = vpa || "default@paybolt";
    const paymentStr = `&pa=${fallbackVpa}&am=${amount}&tr=${orderId}&tn=Payment_for_${orderId}&cu=INR&exp=${new Date(Date.now() + 60 * 1000).getTime()}`;

    return `upi://pay?${paymentStr}`;
  }
};
```

## Environment Configuration

### VPA Configuration

```bash
# Multiple VPAs with enhanced properties
UTKARSH_VPAS='[
  {
    "vpa": "vpa1@bank1",
    "priority": 1,
    "isActive": true,
    "description": "Primary VPA for high-value transactions",
    "maxDailyTransactions": 1000,
    "maxDailyAmount": 1000000,
    "healthCheckUrl": "https://api.bank1.com/health",
    "timeoutMs": 30000,
    "retryAttempts": 3,
    "circuitBreakerThreshold": 5,
    "rateLimitPerMinute": 1000
  },
  {
    "vpa": "vpa2@bank2",
    "priority": 2,
    "isActive": true,
    "description": "Secondary VPA for medium transactions",
    "maxDailyTransactions": 2000,
    "maxDailyAmount": 500000,
    "circuitBreakerThreshold": 3,
    "rateLimitPerMinute": 1500
  }
]'

# Routing strategy
UTKARSH_VPA_ROUTING_STRATEGY=health_based
```

## API Endpoints

### Get Real-Time VPA Statistics

```http
GET /api/v1/payments/vpa/stats
```

Response:
```json
{
  "totalVPAs": 2,
  "activeVPAs": 2,
  "currentRoundRobinIndex": 1,
  "routingStrategy": "health_based",
  "circuitBreakers": [
    {
      "vpa": "vpa1@bank1",
      "isOpen": false,
      "failures": 0,
      "lastFailure": "2024-01-15T10:30:00.000Z"
    }
  ],
  "healthMetrics": [
    {
      "vpa": "vpa1@bank1",
      "healthScore": 95.5,
      "successRate": 0.955,
      "totalTransactions": 100,
      "averageResponseTime": 2500,
      "isHealthy": true,
      "dailySuccessCount": 45,
      "dailyFailureCount": 2,
      "dailyTotalAmount": 50000,
      "lastTransactionTime": "2024-01-15T10:30:00.000Z",
      "weeklySuccessCount": 320,
      "weeklyFailureCount": 15,
      "monthlySuccessCount": 1200,
      "monthlyFailureCount": 60
    }
  ],
  "vpas": [
    {
      "vpa": "vpa1@bank1",
      "priority": 1,
      "isActive": true,
      "description": "Primary VPA",
      "healthScore": 95.5
    }
  ],
  "realTimeData": {
    "totalActiveTransactions": 5,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

## How Real-Time Metrics Work

### 1. Transaction Start
When a payment link is generated:
- VPA is selected based on routing strategy
- Transaction record is created with `PENDING` status
- Record is stored in memory and cache for webhook processing

### 2. Payment Processing
During payment processing:
- User completes payment through UPI
- Payment gateway sends webhook to your system
- Webhook contains final status (SUCCESS/FAILED)

### 3. Metrics Update
When webhook is processed:
- Transaction record is retrieved from cache
- Response time is calculated (webhook time - creation time)
- VPA metrics are updated based on actual result:
  - **Success**: Increment success count, update response time
  - **Failure**: Increment failure count, update circuit breaker
- Health score is recalculated
- Metrics are cached for future routing decisions

### 4. Health Score Calculation
```
Health Score = (Success Rate × 70%) + (Response Time Score × 30%)

Where:
- Success Rate = Success Count / Total Transactions
- Response Time Score = max(0, 100 - Average Response Time / 10)
```

## Routing Strategies

### 1. Health-Based (Recommended)
Always selects the VPA with the highest health score.

### 2. Adaptive
Combines health score, priority, and current load.

### 3. Enhanced Round-Robin
Distributes transactions across VPAs, prioritizing healthier ones.

## Circuit Breaker Pattern

When a VPA fails repeatedly:
- Circuit breaker opens after threshold failures
- VPA is excluded from routing until timeout
- Circuit breaker resets automatically after timeout
- Prevents cascading failures

## Rate Limiting

Each VPA can have custom rate limits:
- Default: 1000 transactions per minute
- Configurable per VPA
- Exceeds limit → VPA temporarily excluded

## Monitoring and Alerts

The service provides:
- Real-time health metrics
- Circuit breaker status
- Rate limiting status
- Active transaction count
- Historical performance data

## Best Practices

1. **Start with health-based routing** for best reliability
2. **Monitor circuit breakers** to identify problematic VPAs
3. **Set appropriate rate limits** based on VPA capacity
4. **Use historical data** to initialize metrics on startup
5. **Regular metric resets** (daily/weekly/monthly)
6. **Monitor response times** to identify slow VPAs

## Troubleshooting

### No Metrics Being Collected
- Ensure webhook integration is working
- Check that `processPaymentWebhook` is called
- Verify transaction records are being created

### Health Scores Not Updating
- Check cache configuration
- Verify database repository is set
- Ensure webhook processing is successful

### Circuit Breakers Opening Too Often
- Increase circuit breaker threshold
- Check VPA health and response times
- Consider switching to healthier VPAs

## Example Usage

```typescript
// Get current VPA statistics
const stats = await enhancedVpaRoutingService.getEnhancedVPAStats();
console.log('VPA Health Scores:', stats.healthMetrics.map(m => ({
  vpa: m.vpa,
  healthScore: m.healthScore,
  successRate: m.successRate
})));

// Reset daily metrics (call at midnight)
await enhancedVpaRoutingService.resetDailyMetrics();

// Process a payment webhook manually
await enhancedVpaRoutingService.processPaymentWebhook(
  'order123',
  PAYMENT_STATUS.SUCCESS,
  2500 // response time in ms
);
```

This integration ensures your VPA routing decisions are based on real payment performance data, leading to better reliability and user experience. 