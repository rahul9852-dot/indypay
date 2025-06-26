# VPA Routing Setup Guide

This guide explains how to configure multiple VPAs with intelligent routing strategies for the Paybolt payment system.

## Environment Variables Configuration

### Basic VPA Configuration

```bash
# Single VPA (fallback)
UPI_ID=your-default-vpa@bank

# Multiple VPAs with routing configuration
UTKARSH_VPAS='[
  {
    "vpa": "vpa1@bank1",
    "priority": 1,
    "isActive": true,
    "description": "Primary VPA for high-value transactions",
    "maxDailyTransactions": 1000,
    "maxDailyAmount": 1000000
  },
  {
    "vpa": "vpa2@bank2", 
    "priority": 2,
    "isActive": true,
    "description": "Secondary VPA for medium transactions",
    "maxDailyTransactions": 2000,
    "maxDailyAmount": 500000
  },
  {
    "vpa": "vpa3@bank3",
    "priority": 3,
    "isActive": true,
    "description": "Tertiary VPA for small transactions",
    "maxDailyTransactions": 5000,
    "maxDailyAmount": 100000
  }
]'
```

### Routing Strategy Configuration

```bash
# Routing strategy (round_robin, load_balance, user_based, amount_based, priority_based)
UTKARSH_VPA_ROUTING_STRATEGY=round_robin

# Load balance threshold (for load_balance strategy)
UTKARSH_LOAD_BALANCE_THRESHOLD=10000

# User-based mapping (for user_based strategy)
UTKARSH_USER_BASED_MAPPING='{
  "user123": "vpa1@bank1",
  "user456": "vpa2@bank2",
  "user789": "vpa3@bank3"
}'

# Amount-based mapping (for amount_based strategy)
UTKARSH_AMOUNT_BASED_MAPPING='{
  "0-1000": "vpa3@bank3",
  "1001-10000": "vpa2@bank2", 
  "10001-999999": "vpa1@bank1"
}'
```

## Routing Strategies

### 1. Round Robin (Default)
- Cycles through VPAs in order
- Ensures even distribution
- Simple and predictable

### 2. Load Balance
- Routes high-value transactions to high-priority VPAs
- Uses threshold-based routing
- Good for managing transaction limits

### 3. User Based
- Maps specific users to specific VPAs
- Useful for VIP customers or testing
- Provides consistent VPA for users

### 4. Amount Based
- Routes based on transaction amount ranges
- Small amounts → Low priority VPAs
- Large amounts → High priority VPAs

### 5. Priority Based
- Always uses the highest priority VPA
- Good for failover scenarios
- Simple fallback strategy

## API Endpoints

### Get VPA Statistics
```http
GET /api/v1/payments/vpa/stats
```

Response:
```json
{
  "totalVPAs": 3,
  "activeVPAs": 3,
  "currentRoundRobinIndex": 1,
  "routingStrategy": "round_robin",
  "vpas": [
    {
      "vpa": "vpa1@bank1",
      "priority": 1,
      "isActive": true,
      "description": "Primary VPA"
    }
  ]
}
```

### Get Active VPAs
```http
GET /api/v1/payments/vpa/active
```

Response:
```json
[
  {
    "vpa": "vpa1@bank1",
    "priority": 1,
    "isActive": true,
    "description": "Primary VPA"
  }
]
```

## Implementation Details

### VPA Selection Logic

1. **Check Configuration**: Validates if VPAs are configured
2. **Filter Active VPAs**: Only uses VPAs with `isActive: true`
3. **Apply Strategy**: Uses the configured routing strategy
4. **Fallback**: Uses default VPA if no active VPAs found

### Transaction Flow

1. User creates payment request
2. System calls `createUtkarshPaymentLink()`
3. VPA routing service selects appropriate VPA
4. Payment link generated with selected VPA
5. Transaction saved with routing information

### Monitoring and Logging

The system logs:
- VPA selection decisions
- Routing strategy used
- Fallback scenarios
- VPA statistics

## Best Practices

1. **Always have a fallback VPA**: Configure `UPI_ID` as backup
2. **Monitor VPA limits**: Track daily transaction counts and amounts
3. **Test routing strategies**: Verify behavior in staging environment
4. **Use meaningful descriptions**: Help identify VPAs in logs
5. **Regular health checks**: Monitor VPA availability

## Example Configurations

### High-Volume Merchant
```bash
UTKARSH_VPA_ROUTING_STRATEGY=load_balance
UTKARSH_LOAD_BALANCE_THRESHOLD=5000
```

### VIP Customer Setup
```bash
UTKARSH_VPA_ROUTING_STRATEGY=user_based
UTKARSH_USER_BASED_MAPPING='{"vip_user_1": "vpa1@bank1"}'
```

### Amount-Based Routing
```bash
UTKARSH_VPA_ROUTING_STRATEGY=amount_based
UTKARSH_AMOUNT_BASED_MAPPING='{
  "0-500": "vpa3@bank3",
  "501-5000": "vpa2@bank2",
  "5001-999999": "vpa1@bank1"
}'
```

## Troubleshooting

### Common Issues

1. **No VPAs configured**: Check `UTKARSH_VPAS` environment variable
2. **No active VPAs**: Verify `isActive` flag in VPA configuration
3. **Routing not working**: Check strategy configuration
4. **Fallback used**: Review VPA selection logs

### Debug Steps

1. Check VPA statistics endpoint
2. Review application logs for routing decisions
3. Verify environment variable format (valid JSON)
4. Test with different routing strategies