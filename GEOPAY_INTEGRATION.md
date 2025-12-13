# GeoPay Checkout Integration

## Overview

This integration provides a secure wrapper API for GeoPay payment gateway that renders a checkout page for users to complete payments. When your API is called, it returns an HTML checkout page that automatically submits to the third-party GeoPay payment gateway.

## Features

✅ **Secure Wrapper API** - Your API endpoint that wraps the GeoPay checkout
✅ **Auto-submit Checkout Form** - Beautiful loading page that auto-submits to GeoPay
✅ **Transaction Tracking** - Stores all payment attempts in database
✅ **Webhook Support** - Handles payment status callbacks from GeoPay
✅ **API Key Authentication** - Requires valid API key for security
✅ **Input Validation** - Validates all input parameters
✅ **Wallet Integration** - Credits user wallet on successful payment
✅ **Commission Calculation** - Automatically calculates commissions and GST

## API Endpoints

### 1. Create GeoPay Checkout

**Endpoint:** `POST /api/v1/payments/payin/geopay/checkout`

**Authentication:** Requires API Key in headers

**Headers:**
```json
{
  "x-api-key": "your-api-key-here",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "orderId": "ORDER123456",
  "amount": 500,
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210"
}
```

**Field Validations:**
- `orderId` (string, required): Unique order identifier
- `amount` (number, required): Payment amount between ₹100 and ₹50,000
- `name` (string, required): Customer name
- `email` (string, required): Valid email address
- `mobile` (string, required): 10-digit mobile number

**Response:**
Returns an HTML page with:
- Beautiful loading animation
- Auto-submit form to GeoPay gateway
- SSL encryption badge
- User-friendly messaging

**Example cURL:**
```bash
curl -X POST https://your-domain.com/api/v1/payments/payin/geopay/checkout \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER123456",
    "amount": 500,
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210"
  }'
```

### 2. GeoPay Webhook

**Endpoint:** `POST /api/v1/payments/payin/geopay/webhook`

**Authentication:** Public (No auth required - called by GeoPay)

**Purpose:** Receives payment status updates from GeoPay

**Webhook Data Format:**
```json
{
  "merchantTxnId": "ORDER123456",
  "status": "SUCCESS",
  "amount": "500.00",
  "utr": "UTR1234567890",
  "timestamp": "1765622687",
  "Signature": "signature-hash"
}
```

**Processing:**
1. Validates merchantTxnId exists
2. Updates payment order status
3. Credits wallet on successful payment
4. Logs all webhook events

## Security Features

### 1. **API Key Authentication**
- Uses `ApiKeyGuard` to validate requests
- Prevents unauthorized access
- API keys stored securely in database

### 2. **Input Validation**
- Strong validation using class-validator
- Email format validation
- Mobile number length check (exactly 10 digits)
- Amount range validation (₹100 - ₹50,000)

### 3. **Duplicate Prevention**
- Checks for existing orders with same orderId
- Prevents duplicate payment attempts
- Returns error if order already exists

### 4. **Transaction Safety**
- Uses database transactions
- Atomic operations for payment + wallet updates
- Rollback on any error

### 5. **Webhook Security**
- Validates signature (can be enhanced)
- Logs all webhook attempts
- Returns 200 OK even on errors to prevent retries
- Idempotent processing (duplicate webhooks handled)

### 6. **SQL Injection Prevention**
- Uses TypeORM parameterized queries
- No raw SQL with user input
- Repository pattern for all database operations

### 7. **XSS Prevention**
- Handlebars template auto-escapes HTML
- All form inputs are hidden and escaped
- No user input rendered as HTML

## Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /payin/geopay/checkout
       │ { orderId, amount, name, email, mobile }
       │
       ▼
┌─────────────────┐
│  Your API       │
│  (Auth Guard)   │
└────────┬────────┘
         │
         │ 1. Validate inputs
         │ 2. Check duplicate orderId
         │ 3. Call GeoPay API
         │ 4. Create DB transaction
         │ 5. Save payin order
         │
         ▼
┌──────────────────┐
│  Render Checkout │
│  HTML Page       │
└────────┬─────────┘
         │
         │ Auto-submit form after 1.5s
         │
         ▼
┌──────────────────┐
│  GeoPay Gateway  │
│  Payment Page    │
└────────┬─────────┘
         │
         │ User completes payment
         │
         ▼
┌──────────────────┐
│  GeoPay Webhook  │
│  Callback        │
└────────┬─────────┘
         │
         │ POST /payin/geopay/webhook
         │ { status, merchantTxnId, utr }
         │
         ▼
┌──────────────────┐
│  Update Order    │
│  Credit Wallet   │
└──────────────────┘
```

## Database Schema

The integration automatically creates/updates the following:

### PayInOrders Table
```typescript
{
  id: string (UUID)
  user: UsersEntity
  orderId: string (unique)
  amount: number
  email: string
  name: string
  mobile: string
  status: PAYMENT_STATUS
  txnRefId: string
  utr: string (nullable)
  commissionAmount: number
  gstAmount: number
  netPayableAmount: number
  createdAt: Date
  updatedAt: Date
}
```

### Transactions Table
```typescript
{
  id: string (UUID)
  user: UsersEntity
  payInOrder: PayInOrdersEntity
  transactionType: PAYMENT_TYPE.PAYIN
  createdAt: Date
  updatedAt: Date
}
```

### Wallet Table (Updated on Success)
```typescript
{
  id: string (UUID)
  user: UsersEntity
  availablePayinBalance: number (credited on success)
  updatedAt: Date
}
```

## Configuration

Add these environment variables to your `.env` file:

```env
# GeoPay Configuration
GEOPAY_SECRET_KEY=your-secret-key
GEOPAY_AGENT_ID=your-agent-id
GEOPAY_AGENT_NAME=your-agent-name

# Base URL for webhooks
BE_BASE_URL=https://your-domain.com
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Amount must be between ₹100 and ₹50,000` | Invalid amount | Use amount within range |
| `Payment order already exists for given orderId` | Duplicate orderId | Use unique orderId |
| `Unable to initiate payment` | GeoPay API error | Check GeoPay credentials |
| `Failed to generate checkout page` | Network/API error | Retry after some time |

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

## Testing

### Test Request
```bash
curl -X POST https://your-domain.com/api/v1/payments/payin/geopay/checkout \
  -H "x-api-key: test-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST'$(date +%s)'",
    "amount": 100,
    "name": "Test User",
    "email": "test@example.com",
    "mobile": "9999999999"
  }'
```

### Test Webhook Locally
```bash
curl -X POST http://localhost:4000/api/v1/payments/payin/geopay/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "merchantTxnId": "TEST123456",
    "status": "SUCCESS",
    "amount": "100.00",
    "utr": "TEST_UTR_123",
    "timestamp": "'$(date +%s)'"
  }'
```

## Monitoring & Logging

All important events are logged:

```typescript
// Checkout creation
✅ `GeoPay Checkout - API Response`
✅ `PAYIN CHECKOUT CREATED`

// Webhook events
✅ `GeoPay webhook received`
✅ `GeoPay Webhook - Received`
✅ `GeoPay Webhook - Order updated to status`
✅ `GeoPay Webhook - Wallet credited`

// Errors
❌ `PAYIN - createGeoPayCheckout - GeoPay API failed`
❌ `GeoPay Webhook - Error processing webhook`
```

## Best Practices

1. **Always use unique orderIds** - Generate using timestamp or UUID
2. **Validate amount on client-side too** - Better UX
3. **Handle webhook failures gracefully** - GeoPay may retry
4. **Monitor webhook delays** - Set up alerts for delayed webhooks
5. **Test in sandbox first** - Use test credentials before production
6. **Keep API keys secure** - Never commit to version control
7. **Set up webhook URL correctly** - Must be publicly accessible
8. **Log everything** - Helps in debugging payment issues

## Support & Troubleshooting

### Payment Not Reflecting?
1. Check webhook is configured correctly
2. Verify webhook URL is publicly accessible
3. Check logs for webhook delivery attempts
4. Verify signature validation is correct

### Checkout Page Not Loading?
1. Verify API key is correct
2. Check GeoPay credentials in `.env`
3. Ensure all required fields are provided
4. Check network connectivity to GeoPay

### Questions?
Contact the development team or check the logs for detailed error messages.

---

**Last Updated:** December 2025
**Version:** 1.0.0
**Maintainer:** Development Team
