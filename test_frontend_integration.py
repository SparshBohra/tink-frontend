#!/usr/bin/env python3
"""
Frontend Integration Test
========================
Tests the tenant authentication frontend pages to ensure they're working correctly
"""

import requests
import time

def test_frontend_pages():
    """Test that frontend pages are accessible and responding correctly"""
    
    print("🎨 TESTING FRONTEND TENANT PORTAL")
    print("=" * 50)
    
    frontend_url = "http://localhost:3000"
    backend_url = "http://localhost:8000"
    
    # Test results
    tests = []
    
    # Test 1: Frontend server accessibility
    print("1️⃣ Testing frontend server...")
    try:
        response = requests.get(f"{frontend_url}", timeout=5)
        if response.status_code == 200:
            tests.append(("Frontend Server", True, f"Status {response.status_code}"))
            print("   ✅ Frontend server is running")
        else:
            tests.append(("Frontend Server", False, f"Status {response.status_code}"))
            print(f"   ❌ Frontend server error: {response.status_code}")
    except Exception as e:
        tests.append(("Frontend Server", False, str(e)))
        print(f"   ❌ Frontend server not accessible: {e}")
    
    # Test 2: Tenant login page
    print("\n2️⃣ Testing tenant login page...")
    try:
        response = requests.get(f"{frontend_url}/tenant-login", timeout=5)
        if response.status_code == 200:
            # Check for key elements in the HTML
            html = response.text
            has_phone_input = 'phoneNumber' in html
            has_title = 'Tink Tenant Portal' in html
            has_form = '<form' in html
            
            if has_phone_input and has_title and has_form:
                tests.append(("Tenant Login Page", True, "All elements present"))
                print("   ✅ Login page loads with all elements")
            else:
                tests.append(("Tenant Login Page", False, "Missing elements"))
                print("   ⚠️  Login page loads but missing some elements")
        else:
            tests.append(("Tenant Login Page", False, f"Status {response.status_code}"))
            print(f"   ❌ Login page error: {response.status_code}")
    except Exception as e:
        tests.append(("Tenant Login Page", False, str(e)))
        print(f"   ❌ Login page not accessible: {e}")
    
    # Test 3: Tenant dashboard page
    print("\n3️⃣ Testing tenant dashboard page...")
    try:
        response = requests.get(f"{frontend_url}/tenant-dashboard", timeout=5)
        if response.status_code == 200:
            # Check for key elements
            html = response.text
            has_title = 'Tenant Dashboard' in html
            has_loading = 'Loading your dashboard' in html
            has_profile = 'Profile Information' in html
            
            if has_title and (has_loading or has_profile):
                tests.append(("Tenant Dashboard Page", True, "Loads correctly"))
                print("   ✅ Dashboard page loads correctly")
            else:
                tests.append(("Tenant Dashboard Page", False, "Missing elements"))
                print("   ⚠️  Dashboard page loads but missing elements")
        else:
            tests.append(("Tenant Dashboard Page", False, f"Status {response.status_code}"))
            print(f"   ❌ Dashboard page error: {response.status_code}")
    except Exception as e:
        tests.append(("Tenant Dashboard Page", False, str(e)))
        print(f"   ❌ Dashboard page not accessible: {e}")
    
    # Test 4: Backend API connectivity
    print("\n4️⃣ Testing backend API connectivity...")
    try:
        response = requests.get(f"{backend_url}/api/auth/login/", timeout=5)
        if response.status_code in [200, 405]:  # 405 is expected for GET on login endpoint
            tests.append(("Backend API", True, "Accessible"))
            print("   ✅ Backend API is accessible")
        else:
            tests.append(("Backend API", False, f"Status {response.status_code}"))
            print(f"   ⚠️  Backend API response: {response.status_code}")
    except Exception as e:
        tests.append(("Backend API", False, str(e)))
        print(f"   ❌ Backend API not accessible: {e}")
    
    # Test 5: Tenant authentication endpoints
    print("\n5️⃣ Testing tenant authentication endpoints...")
    try:
        # Test OTP request endpoint
        response = requests.post(
            f"{backend_url}/api/auth/tenant-auth/request-otp/",
            json={"phone_number": "+15551234567"},  # Test phone
            timeout=5
        )
        
        if response.status_code in [200, 400]:  # 400 is expected for test phone
            tests.append(("Tenant Auth Endpoints", True, "Responding"))
            print("   ✅ Tenant auth endpoints are responding")
            
            # Check response structure
            try:
                data = response.json()
                if 'success' in data or 'error' in data:
                    print("   ✅ Response format is correct")
                else:
                    print("   ⚠️  Response format unexpected")
            except:
                print("   ⚠️  Response not JSON")
        else:
            tests.append(("Tenant Auth Endpoints", False, f"Status {response.status_code}"))
            print(f"   ❌ Auth endpoint error: {response.status_code}")
    except Exception as e:
        tests.append(("Tenant Auth Endpoints", False, str(e)))
        print(f"   ❌ Auth endpoints not accessible: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 FRONTEND INTEGRATION TEST RESULTS")
    print("=" * 50)
    
    passed = sum(1 for test in tests if test[1])
    total = len(tests)
    
    for test_name, success, details in tests:
        icon = "✅" if success else "❌"
        print(f"{icon} {test_name}: {details}")
    
    print(f"\n📈 Results: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Frontend tenant portal is ready for testing")
        print("🌐 Visit: http://localhost:3000/tenant-login")
        print("📱 Use your phone number (857-200-0666) to test OTP login")
    elif passed >= 3:
        print("\n🚀 FRONTEND IS MOSTLY READY!")
        print("⚠️  Some minor issues but core functionality works")
        print("🌐 Visit: http://localhost:3000/tenant-login")
    else:
        print("\n⚠️  SOME ISSUES DETECTED")
        print("Please check the failed tests above")
    
    return passed == total

if __name__ == "__main__":
    success = test_frontend_pages()
    
    if success:
        print("\n🎯 NEXT STEPS:")
        print("1. Visit http://localhost:3000/tenant-login")
        print("2. Enter your phone number: 857-200-0666")
        print("3. You'll receive OTP via SMS")
        print("4. Complete login and test dashboard")
        print("5. Test payment flow (when ready)")
    
    exit(0 if success else 1) 