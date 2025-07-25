#!/usr/bin/env python3
"""Quick Payment API Test Script"""
import requests
import json

BASE_URL = "http://localhost:8000"
LANDLORD_CREDENTIALS = {"username": "david_ggpg", "password": "GoldenGate2024!"}

def get_auth_token():
    response = requests.post(f"{BASE_URL}/api/auth/login/", json=LANDLORD_CREDENTIALS)
    if response.status_code == 200:
        return response.json()["access"]
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_payment_apis():
    print("🧪 Testing Payment APIs...\n")
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("1️⃣ Testing Payment History API...")
    response = requests.get(f"{BASE_URL}/api/auth/payments/history/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Found {len(data.get('payments', []))} payments")
    else:
        print(f"   ❌ Error: {response.text}")
    
    print("\n2️⃣ Testing Payment Summary API...")
    response = requests.get(f"{BASE_URL}/api/auth/payments/summary/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        summary = data.get('summary', {})
        print(f"   ✅ This month: ${summary.get('current_month_total_dollars', 0)}")
        print(f"   ✅ Total payments: {summary.get('total_successful_payments', 0)}")
    else:
        print(f"   ❌ Error: {response.text}")
    
    print("\n✅ API tests complete!")

if __name__ == "__main__":
    test_payment_apis()
