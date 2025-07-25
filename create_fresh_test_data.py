#!/usr/bin/env python3
import os
import sys
import time
import requests
from datetime import datetime, date, timedelta

# Add Django path
backend_path = "/Users/sparshbohra/tink-project/tink/tink-backend"
sys.path.append(backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Landlord, Payment
from tenants.models import Tenant, Lease
from properties.models import Property, Room
from django.utils import timezone

User = get_user_model()

class FreshTestDataCreator:
    def __init__(self):
        self.landlord = None
        self.landlord_user = None
        self.property = None
        self.room = None
        self.tenant = None
        self.lease = None
        self.payments = []

    def create_landlord_with_user(self):
        print("🏢 Creating fresh landlord with user account...")
        
        username = f"test_landlord_{int(time.time())}"
        user = User.objects.create_user(
            username=username,
            email=f"{username}@testlandlord.com",
            password="TestLandlord2024!",
            first_name="Test",
            last_name="Landlord"
        )
        
        self.landlord = Landlord.objects.create(
            org_name="Fresh Test Properties LLC",
            contact_email=user.email,
            contact_phone="555-TEST-001",
            address="123 Test Street, Test City, TC 12345",
            stripe_account_id=f"acct_test_{int(time.time())}",
            stripe_charges_enabled=True,
            stripe_payouts_enabled=True,
            stripe_details_submitted=True
        )
        
        self.landlord_user = user
        
        print(f"   ✅ Created landlord: {self.landlord.org_name}")
        print(f"   ✅ Created user: {user.username}")
        print(f"   ✅ Login credentials: {username} / TestLandlord2024!")
        
        return user, self.landlord

    def create_property_and_room(self):
        print("🏠 Creating property and room...")
        
        self.property = Property.objects.create(
            name="Fresh Test Apartments",
            address="456 Payment Test Ave, Test City, TC 54321",
            landlord=self.landlord,
            property_type="apartment",
            total_rooms=4,
            monthly_rent=1500.00,
            security_deposit=1500.00,
            description="Newly created property for payment testing"
        )
        
        self.room = Room.objects.create(
            property_ref=self.property,
            name="Test Room A1",
            room_type="single",
            monthly_rent=1500.00,
            security_deposit=1500.00,
            available=False,
            description="Test room for payment verification"
        )
        
        print(f"   ✅ Created property: {self.property.name}")
        print(f"   ✅ Created room: {self.room.name}")
        
        return self.property, self.room

    def create_tenant_and_lease(self):
        print("👤 Creating tenant and lease...")
        
        tenant_username = f"test_tenant_{int(time.time())}"
        tenant_user = User.objects.create_user(
            username=tenant_username,
            email=f"{tenant_username}@testtenant.com",
            password="TestTenant2024!",
            first_name="Test",
            last_name="Tenant"
        )
        
        self.tenant = Tenant.objects.create(
            user=tenant_user,
            phone_number="555-TENANT-1",
            date_of_birth=date(1990, 1, 15),
            emergency_contact_name="Emergency Contact",
            emergency_contact_phone="555-EMERGENCY",
            employment_status="employed",
            monthly_income=5000.00
        )
        
        self.lease = Lease.objects.create(
            tenant=self.tenant,
            property_ref=self.property,
            room=self.room,
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() + timedelta(days=335),
            monthly_rent=self.room.monthly_rent,
            security_deposit=self.room.security_deposit,
            status="active"
        )
        
        print(f"   ✅ Created tenant: {self.tenant.user.get_full_name()}")
        print(f"   ✅ Created lease: Active until {self.lease.end_date}")
        
        return self.tenant, self.lease

    def create_test_payments(self):
        print("💳 Creating test payments...")
        
        payment_scenarios = [
            {"amount": 1500, "status": Payment.PaymentStatus.SUCCEEDED, "desc": "January rent - ON TIME"},
            {"amount": 1500, "status": Payment.PaymentStatus.SUCCEEDED, "desc": "February rent - ON TIME"},
            {"amount": 750, "status": Payment.PaymentStatus.SUCCEEDED, "desc": "March rent - PARTIAL (1/2)"},
            {"amount": 750, "status": Payment.PaymentStatus.PENDING, "desc": "March rent - PARTIAL (2/2)"},
            {"amount": 1500, "status": Payment.PaymentStatus.FAILED, "desc": "April rent - FAILED"}
        ]
        
        for i, scenario in enumerate(payment_scenarios):
            amount_cents = int(scenario["amount"] * 100)
            stripe_fee_cents = int(amount_cents * 0.029 + 30)
            
            payment = Payment.objects.create(
                stripe_payment_intent_id=f"pi_fresh_test_{int(time.time())}_{i}",
                landlord=self.landlord,
                tenant=self.tenant,
                lease=self.lease,
                property_ref=self.property,
                amount_cents=amount_cents,
                status=scenario["status"],
                rent_period_start=date.today().replace(day=1) - timedelta(days=30*i),
                rent_period_end=date.today().replace(day=1) - timedelta(days=30*i) + timedelta(days=28),
                payment_date=timezone.now(),
                stripe_fee_cents=stripe_fee_cents,
                application_fee_cents=0,
                net_amount_cents=amount_cents - stripe_fee_cents,
                description=scenario["desc"],
                metadata={"test_payment": True}
            )
            
            self.payments.append(payment)
            status_emoji = {"succeeded": "✅", "pending": "⏳", "failed": "❌"}
            print(f"   {status_emoji[scenario['status']]} Payment {i+1}: ${payment.amount_dollars} - {scenario['status'].upper()}")
        
        print(f"\n🎉 Created {len(self.payments)} test payments!")
        return self.payments

    def test_payment_apis(self):
        print("\n🧪 Testing Payment APIs...")
        
        login_data = {"username": self.landlord_user.username, "password": "TestLandlord2024!"}
        response = requests.post("http://localhost:8000/api/auth/login/", json=login_data)
        
        if response.status_code != 200:
            print(f"   ❌ Login failed: {response.text}")
            return
        
        token = response.json()["access"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        print(f"   ✅ Logged in as: {self.landlord_user.username}")
        
        # Test Payment History
        print("\n1️⃣ Payment History API:")
        response = requests.get("http://localhost:8000/api/auth/payments/history/", headers=headers)
        if response.status_code == 200:
            payments = response.json().get('payments', [])
            print(f"   ✅ Found {len(payments)} payments")
            for payment in payments[:3]:
                print(f"      • ${payment['amount_dollars']} - {payment['status']}")
        else:
            print(f"   ❌ Error: {response.text}")
        
        # Test Payment Summary
        print("\n2️⃣ Payment Summary API:")
        response = requests.get("http://localhost:8000/api/auth/payments/summary/", headers=headers)
        if response.status_code == 200:
            summary = response.json().get('summary', {})
            print(f"   ✅ This month: ${summary.get('current_month_total_dollars', 0)}")
            print(f"   ✅ Total successful: {summary.get('total_successful_payments', 0)}")
            print(f"   ✅ Pending: {summary.get('pending_payments', 0)}")
            print(f"   ✅ Failed: {summary.get('failed_payments', 0)}")
        else:
            print(f"   ❌ Error: {response.text}")

    def print_summary(self):
        print("\n" + "="*50)
        print("🎯 FRESH TEST DATA CREATED!")
        print("="*50)
        print(f"👤 Landlord: {self.landlord_user.username}")
        print(f"🏢 Organization: {self.landlord.org_name}")
        print(f"🏠 Property: {self.property.name}")
        print(f"👨‍💼 Tenant: {self.tenant.user.get_full_name()}")
        print(f"💳 Payments: {len(self.payments)} created")
        
        succeeded = len([p for p in self.payments if p.status == 'succeeded'])
        pending = len([p for p in self.payments if p.status == 'pending'])
        failed = len([p for p in self.payments if p.status == 'failed'])
        
        print(f"   ✅ Succeeded: {succeeded}")
        print(f"   ⏳ Pending: {pending}")
        print(f"   ❌ Failed: {failed}")
        
        print("\n🧪 LOGIN CREDENTIALS:")
        print(f"   Landlord: {self.landlord_user.username} / TestLandlord2024!")
        print(f"   Tenant: {self.tenant.user.username} / TestTenant2024!")
        
        print("\n🌐 FRONTEND TESTING:")
        print("   1. Go to: http://localhost:3001")
        print(f"   2. Login as landlord: {self.landlord_user.username}")
        print("   3. View payment dashboard")

def main():
    print("🚀 CREATING FRESH TEST DATA\n")
    
    creator = FreshTestDataCreator()
    
    try:
        creator.create_landlord_with_user()
        creator.create_property_and_room()
        creator.create_tenant_and_lease()
        creator.create_test_payments()
        creator.test_payment_apis()
        creator.print_summary()
        
        print("\n🎉 COMPLETE! Ready for testing! 🚀")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
