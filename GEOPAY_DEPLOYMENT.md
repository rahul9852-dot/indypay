# GeoPay Integration - Production Deployment Guide

## ✅ Code Changes Completed

### What Was Fixed:
1. **HTML Response Parsing** - GeoPay returns HTML, not JSON
2. **Signature Preservation** - Using GeoPay's signature without modification
3. **Callback URL** - Using GeoPay's callback URL (not overriding)
4. **Transaction ID Mapping** - Supporting both our orderId and GeoPay's generated ID
5. **Fast Form Submission** - Reduced to 1.5 seconds to minimize session timeout

---

## 🚀 Deployment Steps

### 1. Update Environment Variables (Production)
```bash
# .env or environment configuration
GEOPAY_SECRET_KEY=f66loo74yj5yp5j2
GEOPAY_AGENT_ID=8818820004
GEOPAY_AGENT_NAME=NIYOIN CODERS PRIVATE LIMITED
BE_BASE_URL=https://your-production-domain.com
```

### 2. Configure Webhook with GeoPay

**CRITICAL:** Contact GeoPay support to update your webhook URL in their system.

**Request to GeoPay:**
```
Please update our callback/webhook URL to:
https://your-production-domain.com/api/v1/payments/payin/geopay/webhook

Current account:
Agent ID: 8818820004
Agent Name: NIYOIN CODERS PRIVATE LIMITED
```

**Why This Is Important:**
- GeoPay's signature is calculated with the callback URL
- If the callback URL doesn't match, the signature becomes invalid
- This causes "Session Expired" errors

### 3. Whitelist Production IP

```sql
-- Add your production server IP
INSERT INTO user_whitelist_ips ("userId", "ipAddress", "createdAt", "updatedAt")
VALUES (
  'usr_01JC5KWZJ9F35B51NRCNV9C1WV',
  'YOUR_PRODUCTION_SERVER_IP',
  NOW(),
  NOW()
);
```

### 4. Deploy Code
```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Or with PM2
pm2 start dist/main.js --name rupeeflow-api
```

### 5. Test the Integration

```bash
# Test API endpoint
curl -X POST https://your-production-domain.com/api/v1/payments/payin/geopay/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_BASE64_CREDENTIALS" \
  -d '{
    "orderId": "TEST'$(date +%s)'",
    "amount": 100,
    "name": "Test User",
    "email": "test@example.com",
    "mobile": "9123456789"
  }'
```

**Expected Response:**
- Should return HTML with a form
- Form should auto-submit to GeoPay's payment gateway
- No "Session Expired" errors

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] API endpoint is accessible over HTTPS
- [ ] Checkout page renders correctly
- [ ] Form submits to GeoPay without session expiry
- [ ] Payment can be completed successfully
- [ ] Webhook is received (after GeoPay configures it)
- [ ] Payment status updates in database
- [ ] Wallet is credited on successful payment

---

## 📊 Current Implementation Status

### ✅ Working:
- HTML response parsing from GeoPay API
- Signature extraction (preserved without modification)
- Timestamp extraction
- Transaction ID mapping
- Form auto-submission (1.5s delay)
- Database transaction recording
- Webhook handler (ready for GeoPay's callbacks)

### ⚠️ Pending Configuration:
- **Webhook URL in GeoPay's system** (MUST be done by GeoPay support)
- Production environment variables
- Production server IP whitelisting
- SSL certificate for webhook endpoint

### 🔧 How It Works Now:

1. **Your API Called** → Client calls `/payin/geopay/checkout`
2. **GeoPay API Called** → Your server calls GeoPay with transaction details
3. **HTML Parsed** → Extract form fields from GeoPay's HTML response
4. **Form Rendered** → Return checkout page to client
5. **Auto-Submit** → Form submits to GeoPay after 1.5 seconds
6. **Payment Gateway** → User completes payment on GeoPay's page
7. **Callback** → GeoPay calls webhook (once configured)
8. **Database Update** → Webhook handler updates payment status
9. **Wallet Credit** → On success, user wallet is credited

---

## 🚨 Troubleshooting

### Issue: "Session Expired" on GeoPay page
**Cause:** Signature validation failed
**Solution:**
- Ensure you're NOT modifying the callbackUrl (code is fixed)
- Verify all form fields match GeoPay's response exactly
- Check server logs for signature extraction

### Issue: No webhook received after payment
**Cause:** Webhook URL not configured in GeoPay's system
**Solution:**
- Contact GeoPay support to configure webhook URL
- Provide them: `https://your-domain.com/api/v1/payments/payin/geopay/webhook`
- Test with manual webhook call after configuration

### Issue: 401 Unauthorized when calling API
**Cause:** Invalid API key or IP not whitelisted
**Solution:**
- Verify API credentials are correct
- Check production server IP is whitelisted
- Ensure using Basic auth with correct format

---

## 📝 API Credentials

**Client ID:** `key_01KCBSR4PY7TJRVRCJYZWDV0B7`
**Client Secret:** `sc_01KCBSR4PYFDZNYXJ3K9XXX22P`

**Base64 for Authorization Header:**
```
Basic a2V5XzAxS0NCU1I0UFk3VEpSVlJDSllaV0RWMEI3OnNjXzAxS0NCU1I0UFlGRFpOWVhKM0s5WFhYMjJQ
```

---

## 📞 Support Contacts

**GeoPay Support:** Contact your GeoPay account manager for:
- Webhook URL configuration
- Production credentials verification
- API access issues

**Internal Team:** For code-related issues:
- Check server logs in `/var/log/` or PM2 logs
- Review GEOPAY_PRODUCTION_SETUP.md for detailed guide
- Contact development team lead

---

**Deployment Status:** ✅ Code Ready for Production
**Webhook Configuration:** ⚠️ Requires GeoPay Support Action
**Last Updated:** December 13, 2025
