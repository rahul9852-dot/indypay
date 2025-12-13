# GeoPay Production Error - Debugging Guide

## 🚨 Current Error

```
GeoPay API returned 500 error page
Error: Something went wrong
```

This means **GeoPay's server is rejecting your request** with a 500 Internal Server Error.

---

## 🔍 Root Causes & Solutions

### 1. **Invalid Credentials (Most Common)**

**Symptoms:**
- GeoPay returns 500 error page
- Error message: "Something went wrong"

**Check:**
```bash
# On production server, verify environment variables
echo $GEOPAY_SECRET_KEY
echo $GEOPAY_AGENT_ID
echo $GEOPAY_AGENT_NAME
```

**Expected Values:**
```
GEOPAY_SECRET_KEY=f66loo74yj5yp5j2
GEOPAY_AGENT_ID=8818820004
GEOPAY_AGENT_NAME=NIYOIN CODERS PRIVATE LIMITED
```

**Solution:**
- Verify credentials match what GeoPay provided
- Contact GeoPay to confirm credentials are active for production
- Check if there are separate **production** vs **sandbox** credentials

---

### 2. **Server IP Not Whitelisted by GeoPay**

**Symptoms:**
- 500 error from GeoPay
- Same credentials work locally but fail on production

**Check:**
```bash
# Get your production server's public IP
curl ifconfig.me
```

**Solution:**
1. Contact GeoPay support with your production server IP
2. Request them to whitelist your IP address
3. Wait for confirmation before testing again

---

### 3. **Wrong API Endpoint**

**Check Logs For:**
```
PAYIN - createGeoPayCheckout - API Endpoint: https://gopaydigital.in/api/v1/auth/services/niyoin-ut
```

**Verify:**
- Is this the correct production endpoint?
- GeoPay might have different endpoints for sandbox vs production
- Contact GeoPay to confirm the correct endpoint

---

### 4. **Invalid Payload Format**

**Check Logs For:**
```json
{
  "agentId": "8818820004",
  "secretKey": "f66l****",
  "partnertxnid": "ORDER123",
  "merchantTxnAmount": "100",
  "agentname": "NIYOIN CODERS PRIVATE LIMITED",
  "agentmobile": "9123184896",
  "agentemail": "rahul@rupeeflow.co"
}
```

**Verify:**
- All required fields are present
- `merchantTxnAmount` is a string (not number)
- `agentId` matches your credentials
- Email and mobile number are valid formats

---

## 🛠️ Debugging Steps

### Step 1: Test GeoPay API Directly

Create a test script on your production server:

```bash
cat > /tmp/test-geopay.sh << 'EOF'
#!/bin/bash

curl -X POST https://gopaydigital.in/api/v1/auth/services/niyoin-ut \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "8818820004",
    "secretKey": "f66loo74yj5yp5j2",
    "partnertxnid": "TEST'$(date +%s)'",
    "merchantTxnAmount": "100",
    "agentname": "NIYOIN CODERS PRIVATE LIMITED",
    "agentmobile": "9123184896",
    "agentemail": "test@example.com"
  }'
EOF

chmod +x /tmp/test-geopay.sh
/tmp/test-geopay.sh
```

**Expected Response:** HTML form with payment fields

**If you get 500 error:** Credentials or IP issue - contact GeoPay

---

### Step 2: Check Environment Variables on Production

```bash
# SSH to production server
ssh your-production-server

# Check if environment variables are loaded
node -e "console.log(process.env.GEOPAY_SECRET_KEY)"
node -e "console.log(process.env.GEOPAY_AGENT_ID)"
node -e "console.log(process.env.GEOPAY_AGENT_NAME)"
```

**If empty:** Environment variables not loaded properly

**Solution:**
```bash
# Reload PM2 with environment
pm2 restart rupeeflow-api --update-env

# Or add to ecosystem.config.js
module.exports = {
  apps: [{
    name: 'rupeeflow-api',
    script: './dist/main.js',
    env: {
      GEOPAY_SECRET_KEY: 'f66loo74yj5yp5j2',
      GEOPAY_AGENT_ID: '8818820004',
      GEOPAY_AGENT_NAME: 'NIYOIN CODERS PRIVATE LIMITED'
    }
  }]
}
```

---

### Step 3: Check Production Logs

```bash
# View recent logs
pm2 logs rupeeflow-api --lines 100

# Filter for GeoPay errors
pm2 logs rupeeflow-api | grep "PAYIN - createGeoPayCheckout"
```

**Look for:**
```
✅ PAYIN - createGeoPayCheckout - Request payload: {...}
❌ GeoPay API returned 500 error
❌ Possible causes: Invalid credentials...
```

---

### Step 4: Verify Database IP Whitelist

```sql
-- Connect to production database
SELECT "ipAddress"
FROM user_whitelist_ips
WHERE "userId" = 'usr_01JC5KWZJ9F35B51NRCNV9C1WV';
```

**Add Production Server IP:**
```sql
INSERT INTO user_whitelist_ips ("userId", "ipAddress", "createdAt", "updatedAt")
VALUES (
  'usr_01JC5KWZJ9F35B51NRCNV9C1WV',
  'YOUR_PRODUCTION_IP',
  NOW(),
  NOW()
);
```

---

## 📞 Contact GeoPay Support

If all above steps fail, contact GeoPay with this information:

```
Subject: Production API 500 Error

Account Details:
- Agent ID: 8818820004
- Agent Name: NIYOIN CODERS PRIVATE LIMITED
- Environment: Production

Issue:
Your API is returning 500 error when we make requests.

API Endpoint: https://gopaydigital.in/api/v1/auth/services/niyoin-ut

Our Server IP: [YOUR_PRODUCTION_IP]

Sample Request:
{
  "agentId": "8818820004",
  "secretKey": "[MASKED]",
  "partnertxnid": "TEST123",
  "merchantTxnAmount": "100",
  "agentname": "NIYOIN CODERS PRIVATE LIMITED",
  "agentmobile": "9123184896",
  "agentemail": "test@example.com"
}

Please verify:
1. Are our credentials active for production?
2. Is our server IP whitelisted?
3. Is the API endpoint correct?
4. Is there any issue with your service?
```

---

## ✅ Success Indicators

When working correctly, you should see:

**In Logs:**
```
PAYIN - createGeoPayCheckout - API Endpoint: https://gopaydigital.in/...
PAYIN - createGeoPayCheckout - Request payload: {...}
GeoPay Checkout - Raw API Response Type: string, Length: 2846
CHECKOUT FORM DATA PREPARED: {...}
```

**Response:**
- HTML form with valid timestamp and signature
- No 500 errors
- Checkout page renders successfully

---

## 🔄 Quick Fix Checklist

- [ ] Verify GEOPAY_SECRET_KEY on production server
- [ ] Verify GEOPAY_AGENT_ID on production server
- [ ] Verify GEOPAY_AGENT_NAME on production server
- [ ] Get production server's public IP
- [ ] Test GeoPay API directly from production server
- [ ] Contact GeoPay to whitelist production IP
- [ ] Confirm credentials are for production (not sandbox)
- [ ] Restart application after environment changes
- [ ] Test with small amount (₹100)
- [ ] Check server logs for detailed error info

---

**Last Updated:** December 13, 2025
