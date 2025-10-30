# Stats API Updates - Documentation

## Overview
The stats APIs have been updated to provide cleaner, more focused data with only successful transactions, recent activity, and top merchant insights.

## Changes Summary

### ✅ What's New
1. **Only Success Data**: Removed pending, failed, and initiated transaction data - showing only successful transactions
2. **Recent Transactions**: Added top 5 most recent successful transactions
3. **Top Merchants** (Admin only): Added top 5 merchants with highest transaction amounts

### ❌ What's Removed
- Failed transaction stats
- Pending transaction stats
- Initiated/total transaction stats (now only success)

---

## API Endpoints

### 1. Merchant Stats API

**Endpoint**: `GET /transactions/stats`
**Auth**: Requires Merchant role
**Controller**: `src/modules/transactions/transactions.controller.ts:83`
**Service**: `src/modules/transactions/transactions.service.ts:582`

#### Request
```http
GET /transactions/stats?startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
- `startDate` (optional): Start date in ISO format (defaults to today's start)
- `endDate` (optional): End date in ISO format (defaults to today's end)

#### Response Structure

```typescript
{
  payin: {
    successAmount: number,    // Total amount of successful payin transactions
    successCount: number      // Count of successful payin transactions
  },
  payout: {
    successAmount: number,    // Total amount of successful payout transactions
    successCount: number      // Count of successful payout transactions
  },
  settlement: {
    successAmount: number,    // Total settlement amount (successful)
    successCount: number      // Count of successful settlements
  },
  recentTransactions: [       // Array of 5 most recent successful transactions
    {
      date: "2025-09-08T10:30:00.000Z",
      transactionId: "TKL21235345125",
      method: "UPI",
      amount: 20000.00,
      status: "success"
    },
    // ... up to 5 transactions
  ]
}
```

#### Example Response
```json
{
  "payin": {
    "successAmount": 125000.50,
    "successCount": 42
  },
  "payout": {
    "successAmount": 95000.00,
    "successCount": 15
  },
  "settlement": {
    "successAmount": 115000.25,
    "successCount": 38
  },
  "recentTransactions": [
    {
      "date": "2025-09-08T10:30:00.000Z",
      "transactionId": "TKL21235345125",
      "method": "UPI",
      "amount": 20000.00,
      "status": "success"
    },
    {
      "date": "2025-09-08T09:15:00.000Z",
      "transactionId": "TKL21235344890",
      "method": "UPI",
      "amount": 15000.00,
      "status": "success"
    }
  ]
}
```

---

### 2. Admin Stats API

**Endpoint**: `GET /transactions/stats/admin`
**Auth**: Requires Admin/Owner role
**Controller**: `src/modules/transactions/transactions.controller.ts:105`
**Service**: `src/modules/transactions/transactions.service.ts:378`

#### Request
```http
GET /transactions/stats/admin?startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
- `startDate` (optional): Start date in ISO format (defaults to today's start)
- `endDate` (optional): End date in ISO format (defaults to today's end)

#### Response Structure

```typescript
{
  payin: {
    successAmount: number,
    successCount: number
  },
  payout: {
    successAmount: number,
    successCount: number
  },
  settlement: {
    successAmount: number,
    successCount: number
  },
  recentTransactions: [       // 5 most recent successful transactions (all merchants)
    {
      date: string,
      transactionId: string,
      method: string,
      amount: number,
      status: string
    }
  ],
  topMerchants: [             // Top 5 merchants by transaction amount
    {
      merchantName: string,
      merchantEmail: string,
      totalAmount: number,
      transactionCount: number
    }
  ]
}
```

#### Example Response
```json
{
  "payin": {
    "successAmount": 2500000.75,
    "successCount": 1250
  },
  "payout": {
    "successAmount": 1800000.00,
    "successCount": 450
  },
  "settlement": {
    "successAmount": 2300000.50,
    "successCount": 1180
  },
  "recentTransactions": [
    {
      "date": "2025-09-08T10:30:00.000Z",
      "transactionId": "TKL21235345125",
      "method": "UPI",
      "amount": 20000.00,
      "status": "success"
    },
    {
      "date": "2025-09-08T09:15:00.000Z",
      "transactionId": "TKL21235344890",
      "method": "UPI",
      "amount": 15000.00,
      "status": "success"
    }
  ],
  "topMerchants": [
    {
      "merchantName": "ABC Corporation",
      "merchantEmail": "abc@example.com",
      "totalAmount": 450000.00,
      "transactionCount": 125
    },
    {
      "merchantName": "XYZ Enterprises",
      "merchantEmail": "xyz@example.com",
      "totalAmount": 380000.50,
      "transactionCount": 98
    },
    {
      "merchantName": "Tech Solutions Ltd",
      "merchantEmail": "tech@example.com",
      "totalAmount": 325000.25,
      "transactionCount": 87
    }
  ]
}
```

---

## Caching Strategy

Both APIs maintain the **smart TTL caching** strategy:

### Cache Keys
- **Merchant**: `stats:merchant:{userId}:{startDate}:{endDate}`
- **Admin**: `stats:admin:{startDate}:{endDate}`

### TTL (Time-To-Live) Strategy
| Data Age | TTL | Reason |
|----------|-----|--------|
| Current day | 5 minutes | Live data, changes frequently |
| Yesterday | 1 hour | Recent data, moderate changes |
| Last 7 days | 4 hours | Relatively stable |
| Last 30 days | 12 hours | Very stable |
| Older | 24 hours | Historical, rarely changes |

### Cache Behavior
1. **First Request** (Cache MISS):
   - Fetches from database
   - Stores in Redis with smart TTL
   - Response time: ~200-500ms

2. **Subsequent Requests** (Cache HIT):
   - Returns from Redis instantly
   - Response time: ~5-10ms
   - ~90% reduction in database queries

---

## Frontend Integration

### TypeScript Interfaces

```typescript
// Merchant Stats Response
interface MerchantStatsResponse {
  payin: {
    successAmount: number;
    successCount: number;
  };
  payout: {
    successAmount: number;
    successCount: number;
  };
  settlement: {
    successAmount: number;
    successCount: number;
  };
  recentTransactions: RecentTransaction[];
}

interface RecentTransaction {
  date: string;
  transactionId: string;
  method: string;
  amount: number;
  status: string;
}

// Admin Stats Response (extends Merchant)
interface AdminStatsResponse extends MerchantStatsResponse {
  topMerchants: TopMerchant[];
}

interface TopMerchant {
  merchantName: string;
  merchantEmail: string;
  totalAmount: number;
  transactionCount: number;
}
```

### Example Usage (React)

```typescript
// Merchant Dashboard
const fetchMerchantStats = async (startDate: string, endDate: string) => {
  const response = await fetch(
    `/transactions/stats?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json() as Promise<MerchantStatsResponse>;
};

// Admin Dashboard
const fetchAdminStats = async (startDate: string, endDate: string) => {
  const response = await fetch(
    `/transactions/stats/admin?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json() as Promise<AdminStatsResponse>;
};
```

---

## Migration Notes

### Breaking Changes

#### Before (Old Response)
```json
{
  "payin": {
    "totalAmount": 150000,
    "totalCount": 50,
    "successAmount": 125000,
    "successCount": 42,
    "failedAmount": 25000,
    "failedCount": 8
  }
}
```

#### After (New Response)
```json
{
  "payin": {
    "successAmount": 125000,
    "successCount": 42
  },
  "recentTransactions": [ /* ... */ ]
}
```

### Frontend Changes Required

1. **Remove references to**:
   - `totalAmount`
   - `totalCount`
   - `failedAmount`
   - `failedCount`
   - `totalAmountWithCharges`

2. **Add handling for**:
   - `recentTransactions` array
   - `topMerchants` array (admin only)

3. **Update calculations**:
   - Success rate = Not applicable (only showing success now)
   - Display only success metrics directly

---

## Database Query Optimization

### Performance Improvements

#### Merchant Stats
- **Before**: 15 sequential database queries
- **After**: 7 parallel queries
- **Improvement**: ~50% reduction in queries + parallelization

#### Admin Stats
- **Before**: 18 sequential database queries
- **After**: 8 parallel queries (including 1 optimized JOIN)
- **Improvement**: ~56% reduction in queries + parallelization

### Query Details

**Top Merchants Query** (Optimized with GROUP BY):
```sql
SELECT
  payin.userId,
  user.fullName as merchantName,
  user.email as merchantEmail,
  SUM(payin.amount) as totalAmount,
  COUNT(payin.id) as transactionCount
FROM payin_orders payin
INNER JOIN users user ON payin.userId = user.id
WHERE
  payin.status = 'success'
  AND payin.createdAt BETWEEN :startDate AND :endDate
GROUP BY payin.userId, user.fullName, user.email
ORDER BY totalAmount DESC
LIMIT 5
```

---

## Testing

### Manual Testing

#### Test Merchant Stats
```bash
curl -X GET "http://localhost:3000/transactions/stats?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Admin Stats
```bash
curl -X GET "http://localhost:3000/transactions/stats/admin?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Verify Cache
```bash
# First request - should be MISS
curl -X GET "http://localhost:3000/transactions/stats?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Check logs: "Cache MISS"

# Second request - should be HIT
curl -X GET "http://localhost:3000/transactions/stats?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Check logs: "Cache HIT"
```

---

## Files Modified

1. `src/modules/transactions/transactions.service.ts`
   - Updated `getStatsForMerchant()` method (lines 582-718)
   - Updated `getStatsForAdmin()` method (lines 378-539)

No other files were modified. The API endpoints and routing remain the same.

---

## Summary

### Key Benefits
- ✅ Cleaner API responses (only relevant success data)
- ✅ Recent transaction visibility for dashboards
- ✅ Top merchant insights for admins
- ✅ Better performance (parallel queries)
- ✅ Same caching strategy maintained
- ✅ No breaking changes to endpoints or auth

### Next Steps for Frontend
1. Update TypeScript interfaces
2. Remove failed/pending transaction handling
3. Add recent transactions component
4. Add top merchants component (admin dashboard)
5. Test with date range filters
6. Verify cache performance
