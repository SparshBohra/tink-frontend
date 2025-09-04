# 🐒 Quick Testing Checklist

## 🔐 Auth & Registration
- [ ] Valid registration flow
- [ ] Duplicate email/phone attempts
- [ ] Invalid email formats
- [ ] Weak vs strong passwords
- [ ] Login with invalid credentials
- [ ] Password reset flow
- [ ] Session timeout

## 🏠 Property Management
- [ ] Individual rent property creation
- [ ] Room-level rent property creation
- [ ] Invalid rent amounts (negative, zero)
- [ ] Missing required fields
- [ ] Room count mismatches
- [ ] Duplicate room names
- [ ] Property deletion with tenants
- [ ] Image upload limits

## 📝 Listings
- [ ] Create listing for both property types
- [ ] Activate/deactivate listings
- [ ] Public listing access
- [ ] Listing with incomplete property
- [ ] Delete listing with applications

## 👥 Applications
- [ ] Public application submission
- [ ] Required field validation
- [ ] File upload testing
- [ ] Duplicate applications
- [ ] Approve with room assignment
- [ ] Reject with reasons
- [ ] Application for deactivated listing

## 👁️ Viewings
- [ ] Schedule viewing for approved app
- [ ] Past date scheduling
- [ ] Double-booking prevention
- [ ] Mark viewing completed (all outcomes)
- [ ] Reschedule existing viewings
- [ ] Cancel viewings

## 📋 Lease Management
### Auto-Generated Leases
- [ ] Generate lease from application
- [ ] Invalid lease terms (dates)
- [ ] Zero/negative rent amounts
- [ ] Very short/long durations

### Custom Lease Upload
- [ ] Toggle between auto/upload
- [ ] Valid file upload (PDF, DOC, DOCX)
- [ ] Invalid file formats
- [ ] File size limit testing (10MB+)
- [ ] Upload without file selected

### Lease Operations
- [ ] Send lease to tenant
- [ ] Lease signing workflow
- [ ] Lease activation
- [ ] Lease renewal initiation

### Move-Out Process
- [ ] Move-out from leases page
- [ ] Move-out from tenant dashboard  
- [ ] Move-out from applications kanban
- [ ] Move-out date validation
- [ ] Security deposit calculations
- [ ] Financial impact display
- [ ] Room availability updates

## 💰 Payment Integration
### Without Stripe Setup
- [ ] Tenant payment attempts
- [ ] Error handling messages
- [ ] Fallback scenarios

### With Stripe Setup
- [ ] Stripe Connect onboarding
- [ ] Incomplete onboarding
- [ ] Payment processing
- [ ] Failed payments
- [ ] Payment history

## 🏠 Tenant Portal
- [ ] OTP login with valid phone
- [ ] OTP with invalid phone
- [ ] OTP expiration
- [ ] Dashboard without payments
- [ ] Tenant move-out requests
- [ ] Lease document access

## 📊 Dashboard
- [ ] Property statistics
- [ ] Revenue analytics
- [ ] Recent activity
- [ ] Data export
- [ ] Empty data scenarios

## 🚨 Edge Cases
- [ ] Network disconnection
- [ ] Slow network simulation
- [ ] Concurrent operations
- [ ] Large file uploads
- [ ] SQL injection attempts
- [ ] XSS testing
- [ ] Browser compatibility
- [ ] Mobile responsiveness

## 🎯 Critical Paths to Test
1. **Registration → Property → Listing → Application → Lease → Move-out**
2. **Custom lease upload end-to-end**
3. **Tenant portal without landlord payment setup**
4. **Payment setup → Tenant payment flow**
5. **Viewing scheduling → Reschedule → Complete**
6. **Move-out from all three locations**
7. **Lease renewal process**

## 📝 Bug Report Template
**Title:** [Brief description]
**Steps:** 
1. Step 1
2. Step 2
3. Step 3

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Browser:** [Chrome/Firefox/Safari]
**Severity:** [Critical/High/Medium/Low] 