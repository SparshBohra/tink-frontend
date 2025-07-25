# 🧪 STRIPE PAYMENT TESTING GUIDE

## 🔑 TEST MODE CONFIRMATION

✅ **YOU'RE IN TEST MODE** - No real money will be charged!
- Keys start with `pk_test_` and `sk_test_`
- All transactions are simulated
- No real credit cards are charged

## 💳 TEST CARD NUMBERS

### ✅ SUCCESSFUL PAYMENTS
```
Card: 4242 4242 4242 4242
Exp:  12/34
CVC:  123
ZIP:  12345

Card: 4000 0056 0000 0008  (Debit card)
Card: 5555 5555 5555 4444  (Mastercard)
```

### ❌ DECLINED PAYMENTS
```
Card: 4000 0000 0000 0002  (Generic decline)
Card: 4000 0000 0000 9995  (Insufficient funds)
Card: 4000 0000 0000 9987  (Lost card)
Card: 4000 0000 0000 0069  (Expired card)
```

### ⏳ AUTHENTICATION REQUIRED
```
Card: 4000 0025 0000 3155  (3D Secure authentication)
Card: 4000 0027 6000 3184  (3D Secure authentication)
```

## 🧪 TEST SCENARIOS

### Scenario 1: Happy Path
**Setup:**
1. Start frontend: `npm run dev`
2. Start backend: `python3 manage.py runserver`
3. Start webhook listener: `stripe listen --forward-to localhost:8000/api/auth/stripe/webhook/`

**Test Steps:**
1. Navigate to `http://localhost:3000/tenant-payments`
2. Login as tenant
3. Click "Pay Now"
4. Enter: 4242 4242 4242 4242, 12/34, 123
5. Click "Pay $1250.00"

**Expected Results:**
- ✅ Success message appears
- ✅ Payment history updates
- ✅ Webhook shows `payment_intent.succeeded`
- ✅ Database has new Payment record

### Scenario 2: Declined Payment
**Test Steps:**
1. Same setup as Scenario 1
2. Enter: 4000 0000 0000 0002, 12/34, 123
3. Click "Pay $1250.00"

**Expected Results:**
- ❌ Error message: "Your card was declined"
- ❌ No payment record created
- ❌ Payment history unchanged

### Scenario 3: Authentication Required
**Test Steps:**
1. Same setup as Scenario 1
2. Enter: 4000 0025 0000 3155, 12/34, 123
3. Click "Pay $1250.00"
4. Complete 3D Secure modal

**Expected Results:**
- 🔐 3D Secure popup appears
- ✅ After authentication, payment succeeds
- ✅ Payment record created

## 🔍 VERIFICATION METHODS

### Check Database
```bash
python3 manage.py shell -c "
from accounts.models import Payment
for p in Payment.objects.all():
    print(f'${p.amount_dollars} - {p.status} - {p.tenant}')
"
```

### Check Stripe Dashboard
Visit: https://dashboard.stripe.com/test/payments

### Check Webhook Events
Terminal 3 will show real-time events:
```
2024-01-15 10:30:15 --> payment_intent.created
2024-01-15 10:30:20 --> payment_intent.succeeded
```

### Check Frontend
- Tenant: Payment history updates
- Landlord: Dashboard shows new payment

## 🚨 TROUBLESHOOTING

### "Payment system not ready"
- Check STRIPE_PUBLISHABLE_KEY is set
- Verify frontend environment variables

### "Invalid webhook signature"
- Ensure webhook secret matches
- Check STRIPE_WEBHOOK_SECRET environment variable

### "No active lease found"
- Create test tenant with active lease
- Check lease status in database

### Payment form doesn't load
- Verify Stripe.js loaded correctly
- Check browser console for errors

## 📊 TEST DATA CLEANUP

### Clear Test Payments
```bash
python3 manage.py shell -c "
from accounts.models import Payment, StripeWebhookEvent
Payment.objects.all().delete()
StripeWebhookEvent.objects.all().delete()
print('Test data cleared!')
"
```

### Reset Stripe Test Data
Visit: https://dashboard.stripe.com/test/developers

## 🎯 PRODUCTION CHECKLIST

Before going live:
- [ ] Switch to live Stripe keys (`pk_live_`, `sk_live_`)
- [ ] Configure production webhook endpoint
- [ ] Test with real bank account in Stripe Connect
- [ ] Verify tax/fee calculations
- [ ] Test refund processes
- [ ] Set up monitoring and alerts

## 🛡️ SECURITY NOTES

- Test keys are safe to commit to version control
- Live keys should NEVER be committed
- Use environment variables for all keys
- Webhook signature verification is critical
- Always validate payment amounts server-side

## 💡 TEST TIPS

1. **Use multiple browsers** to test different user roles
2. **Test mobile devices** for responsive design
3. **Simulate slow networks** to test loading states
4. **Test edge cases** like very large amounts
5. **Verify email notifications** if implemented
6. **Test concurrent payments** from multiple tenants
7. **Check timezone handling** for payment dates
8. **Verify currency formatting** in different locales

---

## 🎯 READY TO TEST!

Your payment system is ready for comprehensive testing. Start with Scenario 1 and work through each test case to ensure everything works perfectly before going live!

Remember: **NO REAL MONEY IS INVOLVED** in test mode! 🎉 