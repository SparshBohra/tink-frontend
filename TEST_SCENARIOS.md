# 🧪 Detailed Test Scenarios

## 🎯 Critical Flow Testing

### Scenario 1: Complete Landlord Journey (Happy Path)
**Goal:** Test end-to-end landlord experience
1. Register new landlord account
2. Create individual rent property ($2000/month)
3. Create active listing for property
4. Submit application via public listing
5. Approve application and generate auto lease
6. Send lease to tenant
7. Process move-out after 6 months

### Scenario 2: Custom Lease Upload Flow
**Goal:** Test custom lease document feature
1. Login as existing landlord
2. Go to applications page
3. Click "Generate Lease" on approved application
4. Toggle to "Upload Custom Lease"
5. Try uploading invalid file format (.txt)
6. Upload valid PDF lease document
7. Fill lease terms and generate
8. Verify custom lease is used instead of auto-generated

### Scenario 3: Room-Level Property Edge Cases
**Goal:** Test complex room management
1. Create room-level property
2. Add 5 rooms with different configurations
3. Try to add room with duplicate name
4. Set one room to 0 capacity
5. Set negative rent for one room
6. Delete a room after creation
7. Create listing and test room assignment

### Scenario 4: Tenant Portal Without Payment Setup
**Goal:** Test tenant experience when landlord hasn't set up payments
1. Create lease for tenant (without Stripe setup)
2. Login to tenant portal with OTP
3. Try to make rent payment
4. Verify error messages and guidance
5. Check payment history (should be empty)
6. Test move-out request functionality

### Scenario 5: Move-Out from All Locations
**Goal:** Test move-out feature comprehensively
1. Create active lease with tenant
2. Test move-out from leases page:
   - Select past move-out date
   - Select future move-out date
   - Adjust security deposit return
   - Verify financial calculations
3. Test tenant-initiated move-out:
   - Login to tenant portal
   - Request move-out with custom date
   - Verify landlord sees the request
4. Test move-out from applications kanban:
   - Find moved-in application
   - Click move-out button
   - Process move-out

## 🐛 Edge Case Scenarios

### Scenario 6: Data Validation Stress Test
**Goal:** Break input validation
1. Property creation with:
   - Name: 500+ characters
   - Rent: -$1000
   - Description: HTML/JavaScript code
   - Address: Special characters only
2. Room creation with:
   - Capacity: -5 people
   - Name: SQL injection attempt
   - Rent: $0.00

### Scenario 7: File Upload Boundary Testing
**Goal:** Test file upload limits
1. Custom lease upload:
   - Upload 15MB PDF file
   - Upload corrupted PDF
   - Upload executable file (.exe)
   - Upload empty file
2. Property images:
   - Upload 20 images at once
   - Upload very large image (50MB)
   - Upload non-image file

### Scenario 8: Concurrent User Testing
**Goal:** Test system under concurrent load
1. Open 5 browser tabs
2. Login with same account in all tabs
3. Simultaneously:
   - Create properties in different tabs
   - Process applications
   - Generate leases
   - Update room availability
4. Check for data consistency issues

### Scenario 9: Network Interruption Testing
**Goal:** Test system resilience
1. Start property creation process
2. Disconnect internet halfway through
3. Reconnect and try to continue
4. Test auto-save functionality
5. Verify data integrity

### Scenario 10: Payment Integration Edge Cases
**Goal:** Test Stripe integration thoroughly
1. Start Stripe Connect onboarding
2. Abandon process halfway
3. Return and complete onboarding
4. Test with invalid bank details
5. Test payment processing with:
   - Expired cards
   - Insufficient funds
   - International cards

## 🔒 Security Testing Scenarios

### Scenario 11: Authentication Bypass Attempts
**Goal:** Test security boundaries
1. Try accessing landlord dashboard without login
2. Manipulate JWT tokens
3. Try accessing other landlord's data
4. Test session timeout enforcement
5. Try concurrent logins from different devices

### Scenario 12: Input Sanitization Testing
**Goal:** Prevent XSS/injection attacks
1. Input JavaScript code in all text fields
2. Try SQL injection in search fields
3. Upload malicious files
4. Test CSRF protection on forms
5. Try path traversal attacks

## 📱 Mobile/Responsive Testing

### Scenario 13: Mobile User Experience
**Goal:** Test mobile functionality
1. Complete landlord registration on mobile
2. Create property with image uploads
3. Process applications on tablet
4. Test tenant portal on various screen sizes
5. Verify touch interactions work properly

## 🎭 User Experience Scenarios

### Scenario 14: Error Recovery Testing
**Goal:** Test user-friendly error handling
1. Trigger various error conditions
2. Verify error messages are clear
3. Test recovery actions suggested
4. Check if user can continue workflow
5. Verify no data loss during errors

### Scenario 15: Accessibility Testing
**Goal:** Ensure platform is accessible
1. Test keyboard navigation only
2. Use screen reader simulation
3. Check color contrast ratios
4. Test with browser zoom at 200%
5. Verify alt text on images

## 🚀 Performance Testing

### Scenario 16: Large Dataset Handling
**Goal:** Test system with large amounts of data
1. Create 100+ properties
2. Generate 500+ applications
3. Test search and filtering performance
4. Check pagination functionality
5. Monitor memory usage

### Scenario 17: API Response Time Testing
**Goal:** Ensure acceptable performance
1. Measure property creation time
2. Test lease generation speed
3. Check dashboard loading times
4. Monitor file upload speeds
5. Test under simulated slow networks

## 📊 Reporting & Analytics

### Scenario 18: Data Export Testing
**Goal:** Test reporting functionality
1. Generate financial reports
2. Export data in different formats
3. Test with empty datasets
4. Test with large date ranges
5. Verify data accuracy in exports

## 🔄 Integration Testing

### Scenario 19: Third-Party Service Failures
**Goal:** Test graceful degradation
1. Simulate Stripe API downtime
2. Test SMS service failures
3. Check email service interruptions
4. Test file storage service issues
5. Verify fallback mechanisms

### Scenario 20: Browser Compatibility
**Goal:** Ensure cross-browser functionality
1. Test complete flow in Chrome
2. Repeat in Firefox
3. Test in Safari (Mac/iOS)
4. Test in Edge
5. Check for browser-specific issues

---

## 📝 Test Execution Notes

### Before Testing:
- [ ] Clear browser cache and cookies
- [ ] Use incognito/private mode
- [ ] Have test data ready (emails, phone numbers)
- [ ] Set up screen recording if needed

### During Testing:
- [ ] Document each step taken
- [ ] Screenshot any errors or unexpected behavior
- [ ] Note browser/device information
- [ ] Record response times for performance issues

### After Testing:
- [ ] Categorize bugs by severity
- [ ] Create detailed bug reports
- [ ] Suggest improvements
- [ ] Update test scenarios based on findings

---

**Testing Tools Recommended:**
- Browser Developer Tools
- Postman for API testing
- Lighthouse for performance
- WAVE for accessibility
- BrowserStack for cross-browser testing 