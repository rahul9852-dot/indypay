# GeoPay Production Setup Guide

## ⚠️ IMPORTANT: Webhook Configuration

### The Issue
GeoPay calculates a `Signature` for payment form validation that includes ALL form fields, including the `callbackUrl`. If you modify the callback URL after GeoPay generates it, the signature becomes invalid and payments will fail with "Session Expired" errors.

### Production Solution

You have **two options** for production deployment:

---

## Option 1: Configure Webhook in GeoPay Portal (RECOMMENDED)

### Steps:
1. **Contact GeoPay Support** and request to update your callback/webhook URL
2. **Provide them with your webhook URL:**
   ```
   https://your-production-domain.com/api/v1/payments/payin/geopay/webhook
   ```
3. **Wait for confirmation** that the URL has been updated in their system
4. **Test the integration** after they confirm the change

### Verification:
After GeoPay updates your webhook URL, make a test API call and check the logs:
```bash
# Check the extracted callback URL in your server logs
# It should show YOUR webhook URL, not GeoPay's default
```

You should see:
```
GeoPay Callback URL from response: https://your-production-domain.com/api/v1/payments/payin/geopay/webhook
```

---

## Option 2: Use GeoPay's Callback URL (Current Implementation)

If GeoPay doesn't support custom webhook configuration, you'll need to use their callback URL and handle it appropriately.

### Current Behavior:
- GeoPay returns: `https://gopaydigital.in/retailer/add_money_callback`
- This is THEIR endpoint, not yours
- Payment status updates go to GeoPay's server first

### Implications:
❌ You won't receive direct webhook callbacks
❌ You'll need to manually poll for payment status
❌ Real-time payment updates won't work

### Alternative: Status Polling
If using GeoPay's callback, implement a status check endpoint:

```typescript
// Add this method to payments.service.ts
async checkGeoPayPaymentStatus(merchantTxnId: string) {
  // Poll GeoPay's status API (if they provide one)
  // Update your database based on the response
}
```

---

## Production Deployment Checklist

### 1. Environment Variables
Update your `.env` file with production values:
```env
# GeoPay Credentials
GEOPAY_SECRET_KEY=your_production_secret_key
GEOPAY_AGENT_ID=your_production_agent_id
GEOPAY_AGENT_NAME=your_production_agent_name

# Base URL (MUST be publicly accessible)
BE_BASE_URL=https://your-production-domain.com
```

### 2. Webhook URL Configuration
- [ ] Confirm webhook URL with GeoPay support
- [ ] Ensure webhook endpoint is publicly accessible
- [ ] Test webhook delivery with a sample payment

### 3. IP Whitelisting
Your production server's IP must be whitelisted in the database:

```sql
-- Add production server IP to whitelist
INSERT INTO user_whitelist_ips ("userId", "ipAddress")
VALUES ('usr_01JC5KWZJ9F35B51NRCNV9C1WV', 'your.production.ip.address');
```

### 4. SSL/TLS Certificate
- [ ] Ensure your domain has a valid SSL certificate
- [ ] GeoPay requires HTTPS for webhook callbacks
- [ ] Test webhook delivery over HTTPS

### 5. API Key Security
- [ ] Never commit API keys to version control
- [ ] Use environment variables for all secrets
- [ ] Rotate keys regularly
- [ ] Store client secrets encrypted in database

### 6. Testing Checklist
- [ ] Test with minimum amount (₹100)
- [ ] Verify signature validation passes
- [ ] Check webhook delivery
- [ ] Test payment success flow
- [ ] Test payment failure flow
- [ ] Verify wallet credit on success
- [ ] Check transaction logging

---

## Troubleshooting

### Session Expires Immediately
**Cause:** Signature validation failed
**Solution:**
- Do NOT modify any form fields after extracting from GeoPay's response
- Ensure callbackUrl is exactly as GeoPay provides it
- Check that timestamp and Signature are correctly extracted

### No Webhook Received
**Cause:** Webhook URL not configured or not accessible
**Solution:**
- Confirm webhook URL with GeoPay support
- Ensure your server is publicly accessible
- Check firewall/security group settings
- Test webhook endpoint manually with curl

### Invalid IP Address Error
**Cause:** Server IP not whitelisted
**Solution:**
- Add production server IP to `user_whitelist_ips` table
- Use the IP that makes requests to your API (may be load balancer IP)

---

## Current Implementation Notes

### What Works:
✅ HTML response parsing from GeoPay API
✅ Signature and timestamp extraction
✅ Transaction ID mapping (both your orderId and GeoPay's ID)
✅ Fast form submission (1.5 seconds)
✅ Database transaction recording
✅ Webhook handler (when properly configured)

### What Needs Configuration:
⚠️ Webhook URL in GeoPay's system
⚠️ Production environment variables
⚠️ IP whitelisting for production server
⚠️ SSL certificate for webhook endpoint

---

## Contact Information

For webhook configuration and production setup assistance:
- **GeoPay Support:** Contact your GeoPay account manager
- **Internal Support:** Check with development team lead

---

**Last Updated:** December 2025
**Version:** 2.0.0 (Production-Ready)
