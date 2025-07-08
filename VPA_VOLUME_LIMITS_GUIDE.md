# 🏦 VPA Volume Limits System Guide

## 📋 Overview

This system automatically tracks and enforces daily volume limits for your VPAs (Virtual Payment Addresses). Each VPA has a **20L (20,00,000 rupees) daily limit** and will be automatically excluded from routing when the limit is reached.

## 🎯 Key Features

### ✅ Automatic Limit Enforcement
- **Daily Amount Limit**: 20L per VPA per day (**ONLY successful transactions**)
- **Daily Transaction Count**: 5000 transactions per VPA per day (**ALL transactions - success + failure**)
- **Real-time Tracking**: Every transaction updates the counters appropriately
- **Automatic Exclusion**: VPAs that reach limits are excluded from routing

### ✅ Smart Monitoring
- **80% Warning Threshold**: Alerts when VPAs approach limits
- **Percentage Tracking**: Shows how much of the limit is used
- **Daily Reset**: All counters reset at midnight
- **Real-time Status**: API endpoints to check current status

### ✅ API Endpoints
- `GET /api/v1/payments/vpa/volume-limits` - Check volume limits status
- `GET /api/v1/payments/vpa/stats` - Get comprehensive VPA statistics
- `GET /api/v1/payments/vpa/debug` - Debug VPA service data

## 🔧 Configuration

### Environment Variables

```bash
# VPA Configuration with Volume Limits
UTKARSH_VPAS=[
  {
    "vpa": "vpa1@paybolt",
    "priority": 1,
    "isActive": true,
    "description": "Primary VPA - 20L daily limit",
    "maxDailyAmount": 2000000,        # 20L limit
    "maxDailyTransactions": 1000,      # 1000 transactions per day
    "circuitBreakerThreshold": 3,
    "rateLimitPerMinute": 500
  },
  {
    "vpa": "vpa2@paybolt", 
    "priority": 2,
    "isActive": true,
    "description": "Secondary VPA - 20L daily limit",
    "maxDailyAmount": 2000000,        # 20L limit
    "maxDailyTransactions": 1000,      # 1000 transactions per day
    "circuitBreakerThreshold": 5,
    "rateLimitPerMinute": 400
  }
]
```

## 📊 How It Works

### 1. **Volume Tracking**
```javascript
// For SUCCESSFUL transactions:
dailyTransactionCount++;           // Total transactions today
dailyTotalAmount += amount;        // Total SUCCESSFUL amount today
volumeLimitPercentage = (dailyTotalAmount / dailyVolumeLimit) * 100;

// For FAILED transactions:
dailyTransactionCount++;           // Total transactions today
// dailyTotalAmount is NOT updated for failures
// Only transaction count is tracked for failures
```

### 2. **Limit Checking**
```javascript
// Before selecting a VPA, system checks:

// Transaction count limit (applies to ALL transactions)
if (dailyTransactionCount >= dailyTransactionLimit) {
    // VPA excluded - transaction limit reached  
    return false;
}

// Volume limit (applies ONLY to successful transactions)
if (dailyTotalAmount >= dailyVolumeLimit) {
    // VPA excluded - volume limit reached
    return false;
}

// Conservative check for volume limit
if (dailyTotalAmount + newTransactionAmount > dailyVolumeLimit) {
    // VPA excluded - would exceed volume limit if successful
    return false;
}
```

### 3. **Smart Routing**
- System only selects VPAs that are within limits
- If all VPAs reach limits, payment fails gracefully
- Automatic fallback to default VPA if configured

## 🚨 Alerts and Monitoring

### Warning Thresholds (80%)
```javascript
if (volumeLimitPercentage >= 80) {
    logger.warn(`VPA ${vpa} approaching volume limit: ${volumeLimitPercentage}%`);
}

if (transactionLimitPercentage >= 80) {
    logger.warn(`VPA ${vpa} approaching transaction limit: ${transactionLimitPercentage}%`);
}
```

### Limit Reached Alerts
```javascript
if (isVolumeLimitReached || isTransactionLimitReached) {
    logger.error(`VPA ${vpa} LIMIT REACHED: volume=${isVolumeLimitReached}, transactions=${isTransactionLimitReached}`);
}
```

## 📈 API Response Examples

### Volume Limits Status
```json
{
  "message": "VPA volume limits status retrieved",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalVPAs": 3,
    "availableVPAs": 2,
    "limitReachedVPAs": 1,
    "approachingLimitVPAs": 0
  },
  "volumeLimits": [
    {
      "vpa": "vpa1@paybolt",
      "dailyTransactionCount": 850,
      "dailyTotalAmount": 1800000,
      "dailyVolumeLimit": 2000000,
      "dailyTransactionLimit": 1000,
      "volumeLimitPercentage": 90.0,
      "transactionLimitPercentage": 85.0,
      "isVolumeLimitReached": false,
      "isTransactionLimitReached": false,
      "status": "AVAILABLE"
    },
    {
      "vpa": "vpa2@paybolt",
      "dailyTransactionCount": 1000,
      "dailyTotalAmount": 2000000,
      "dailyVolumeLimit": 2000000,
      "dailyTransactionLimit": 1000,
      "volumeLimitPercentage": 100.0,
      "transactionLimitPercentage": 100.0,
      "isVolumeLimitReached": true,
      "isTransactionLimitReached": true,
      "status": "LIMIT_REACHED"
    }
  ]
}
```

### Comprehensive VPA Stats
```json
{
  "totalVPAs": 3,
  "activeVPAs": 2,
  "healthMetrics": [
    {
      "vpa": "vpa1@paybolt",
      "healthScore": 95.5,
      "successRate": 0.955,
      "totalTransactions": 100,
      "averageResponseTime": 2500,
      "isHealthy": true,
      "dailySuccessCount": 45,
      "dailyFailureCount": 2,
      "dailyTotalAmount": 1800000,
      "dailyTransactionCount": 850,
      "dailyVolumeLimit": 2000000,
      "dailyTransactionLimit": 1000,
      "isVolumeLimitReached": false,
      "isTransactionLimitReached": false,
      "volumeLimitPercentage": 90.0,
      "transactionLimitPercentage": 85.0
    }
  ]
}
```

## 🔄 Daily Reset Process

### Automatic Reset at Midnight
```javascript
async resetDailyMetrics() {
  this.vpaMetrics.forEach((metrics) => {
    metrics.dailySuccessCount = 0;
    metrics.dailyFailureCount = 0;
    metrics.dailyTotalAmount = 0;
    metrics.dailyTransactionCount = 0;
    metrics.isVolumeLimitReached = false;
    metrics.isTransactionLimitReached = false;
    metrics.volumeLimitPercentage = 0;
    metrics.transactionLimitPercentage = 0;
  });
}
```

## 🛠️ Implementation Details

### Volume Limit Checking
```javascript
private async isVPAWithinLimits(vpa: string, amount?: number): Promise<boolean> {
  const metrics = this.vpaMetrics.get(vpa);
  if (!metrics) return true;

  // Check transaction count limit (applies to ALL transactions)
  if (metrics.isTransactionLimitReached) {
    logger.warn(`VPA ${vpa} has reached daily transaction limit`);
    return false;
  }

  // Check volume limit (applies ONLY to successful transactions)
  if (metrics.isVolumeLimitReached) {
    logger.warn(`VPA ${vpa} has reached daily volume limit`);
    return false;
  }

  // Check if this transaction would exceed limits
  if (amount) {
    const newDailyTransactions = metrics.dailyTransactionCount + 1;

    // Transaction count limit applies to ALL transactions
    if (newDailyTransactions > metrics.dailyTransactionLimit) {
      logger.warn(`VPA ${vpa} would exceed daily transaction limit`);
      return false;
    }

    // Volume limit applies ONLY to successful transactions
    // Conservative check - exclude if would exceed limit if successful
    const newDailyAmount = metrics.dailyTotalAmount + amount;
    if (newDailyAmount > metrics.dailyVolumeLimit) {
      logger.warn(`VPA ${vpa} would exceed daily volume limit if successful`);
      return false;
    }
  }

  return true;
}
```

### Volume Tracking Update (Success Only)
```javascript
private updateVolumeLimitTracking(vpa: string, amount: number): void {
  const metrics = this.vpaMetrics.get(vpa);
  if (!metrics) return;

  // Update transaction count
  metrics.dailyTransactionCount++;

  // Update volume (ONLY for successful transactions)
  metrics.dailyTotalAmount += amount;

  // Calculate percentages
  metrics.volumeLimitPercentage = (metrics.dailyTotalAmount / metrics.dailyVolumeLimit) * 100;
  metrics.transactionLimitPercentage = (metrics.dailyTransactionCount / metrics.dailyTransactionLimit) * 100;
  
  // Check if limits are reached
  metrics.isVolumeLimitReached = metrics.dailyTotalAmount >= metrics.dailyVolumeLimit;
  metrics.isTransactionLimitReached = metrics.dailyTransactionCount >= metrics.dailyTransactionLimit;

  // Log warnings and errors
  if (metrics.volumeLimitPercentage >= 80 || metrics.transactionLimitPercentage >= 80) {
    logger.warn(`VPA ${vpa} approaching limits`);
  }

  if (metrics.isVolumeLimitReached || metrics.isTransactionLimitReached) {
    logger.error(`VPA ${vpa} LIMIT REACHED`);
  }
}
```

### Transaction Count Tracking (Failure Only)
```javascript
private updateTransactionCountTracking(vpa: string): void {
  const metrics = this.vpaMetrics.get(vpa);
  if (!metrics) return;

  // Update transaction count (but NOT volume for failures)
  metrics.dailyTransactionCount++;

  // Calculate transaction percentage only
  metrics.transactionLimitPercentage = (metrics.dailyTransactionCount / metrics.dailyTransactionLimit) * 100;

  // Check if transaction limit is reached
  metrics.isTransactionLimitReached = metrics.dailyTransactionCount >= metrics.dailyTransactionLimit;

  // Log warnings and errors
  if (metrics.transactionLimitPercentage >= 80) {
    logger.warn(`VPA ${vpa} approaching transaction limit`);
  }

  if (metrics.isTransactionLimitReached) {
    logger.error(`VPA ${vpa} TRANSACTION LIMIT REACHED`);
  }
}
```

## 🎯 Best Practices

### 1. **Monitor Regularly**
- Check volume limits status daily
- Set up alerts for 80% threshold
- Monitor API responses for limit warnings

### 2. **Configure Multiple VPAs**
- Use at least 3 VPAs for redundancy
- Set different priorities for load balancing
- Ensure all VPAs have same daily limits

### 3. **Set Up Alerts**
```javascript
// Example alert conditions
if (volumeLimitPercentage >= 80) {
  // Send email/SMS alert
  sendAlert(`VPA ${vpa} approaching 80% volume limit`);
}

if (isVolumeLimitReached) {
  // Send critical alert
  sendCriticalAlert(`VPA ${vpa} volume limit reached!`);
}
```

### 4. **Handle Edge Cases**
- What happens when all VPAs reach limits?
- How to handle high-value transactions?
- What's the fallback strategy?

## 🔍 Troubleshooting

### Common Issues

1. **VPA Not Being Selected**
   - Check if volume limit is reached
   - Verify VPA is active
   - Check circuit breaker status

2. **Incorrect Volume Tracking**
   - Verify transaction amounts are correct
   - Check if daily reset is working
   - Validate cache is being updated

3. **All VPAs Reaching Limits**
   - Add more VPAs to configuration
   - Increase daily limits if possible
   - Implement manual override mechanism

### Debug Commands
```bash
# Check volume limits status
curl -X GET "http://localhost:4000/api/v1/payments/vpa/volume-limits" \
  -H "x-api-key: your-api-key"

# Get comprehensive stats
curl -X GET "http://localhost:4000/api/v1/payments/vpa/stats" \
  -H "x-api-key: your-api-key"

# Debug service data
curl -X GET "http://localhost:4000/api/v1/payments/vpa/debug" \
  -H "x-api-key: your-api-key"
```

## 📝 Summary

This volume limits system provides:

✅ **Automatic 20L daily limit enforcement** (successful transactions only)  
✅ **5000 daily transaction limit** (all transactions - success + failure)  
✅ **Real-time volume tracking**  
✅ **Smart VPA selection**  
✅ **Comprehensive monitoring**  
✅ **Daily reset at midnight**  
✅ **API endpoints for status checking**  
✅ **Warning alerts at 80% threshold**  
✅ **Graceful handling when limits are reached**  

### 🎯 **Updated Limits**
- **Volume Limit**: 20L per VPA per day (only successful transactions)
- **Transaction Limit**: 5000 transactions per VPA per day (all transactions)
- **Default Configuration**: More realistic for high-volume payment systems

The system ensures your VPAs never exceed their daily limits while providing full visibility into usage patterns and automatic failover when needed. 