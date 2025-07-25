#!/usr/bin/env python3
import os
import sys
import time
import requests
from datetime import datetime, date, timedelta

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
        
        username = f"landlord_{int(time.time())}"
        user = User.objects.create_user(
            username=username,
            email=f"{username}@test.com",
            password="TestLandlord2024!",
            first_name="Fresh",
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
        print(f"   ✅ Login: {username} / TestLandlord2024!")
        
        return user, self.landlord

    def create_property_and_room(self):
        print("🏠 Creating property and room...")
        
        self.property = Property.objects.create(
            name="Fresh Test Apartments",
            landlord=self.landlord,
            property_type="apartment",
            rent_type="monthly",
            total_rooms=4,
            monthly_rent=1500.00,
            security_deposit=1500.00,
            address_line1="456 Test Ave",
            city="Test City",
            state="TC",
            postal_code="12345",
            country="US",
            timezone="America/New_York"
        )
        
        self.room = Room.objects.create(
            property_ref=self.property,
            name="Test Room A1",
            room_type="single",
            max_capacity=1,
            current_occupancy=1,
            monthly_rent=1500.00,
            security_deposit=1500.00,
            is_available=False,
            available_from=date.today(),
            floor_number=1,
            square_footage=400,
            room_features={"private_bathroom": True, "furnished": True}
        )
        
        print(f"   ✅ Created property: {self.property.name}")
        print(f"   ✅ Created room: {self.room.name}")
        
        return self.property, self.room

    def create_tenant_and_lease(self):
        print("👤 Creating tenant and lease...")
        
        tenant_username = f"tenant_{int(time.time())}"
        tenant_user = User.objects.create_user(
            username=tenant_username,
            email=f"{tenant_username}@test.com",
            password="TestTenant2024!",
            first_name="Fresh",
            last_name="Tenant"
        )
        
        self.tenant = Tenant.objects.create(
            user=tenant_user,
            phone_number="555-TENANT-1",
            date_of_birth=date(1992, 5, 15),
            emergency_contact_name="Emergency Contact",
            emergency_contact_phone="555-EMERGENCY",
            employment_status="employed",
            monthly_income=6000.00
        )
        
        self.lease = Lease.objects.create(
            tenant=self.tenant,
            property_ref=self.property,
            room=self.room,
            start_date=date.today() - timedelta(days=90),
            end_date=date.today() + timedelta(days=275),
            monthly_rent=self.room.monthly_rent,
            security_deposit=self.room.security_deposit,
            status="active"
        )
        
        print(f"   ✅ Created tenant: {self.tenant.user.get_full_name()}")
        print(f"   ✅ Created lease: Active lease")
        
        return self.tenant, self.lease

    def create_test_payments(self):
        print("💳 Creating test payments...")
        
        scenarios = [
            {"amount": 1500, "status": Payment.PaymentStatus.SUCCEEDED, "desc": "Jan rent - PAID"},
            {"amount": 1500, "status": Payment.PaymentStatus.SUCCEEDED, "desc": "Feb rent - PAID"},
            {"amount": 750, "status": Payment.PaymentStatus.SUCCEEDED, "desc": "Mar rent - PARTIAL (1/2)"},
            {"amount": 750, "status": Payment.PaymentStatus.PENDING, "desc": "Mar rent - PARTIAL (2/2)"},
            {"amount": 200, "status": Payment.PaymentStatus.FAILED, "desc": "Apr rent - FAILED"},
        ]
        
        for i, scenario in enumerate(scenarios):
            amount_cents = int(scenario["amount"] * 100)
            stripe_fee_cents = int(amount_cents * 0.029 + 30)
            
            payment = Payment.objects.create(
                stripe_payment_intent_id=f"pi_test_{int(time.time())}_{i}",
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
            print(f"   {status_emoji[scenario['status']]} ${payment.amount_dollars} - {scenario['status'].upper()}")
        
        print(f"\n🎉 Created {len(self.payments)} test payments!")
        
    def test_payment_apis(self):
        print("\n🧪 Testing Payment APIs...")
        
        # Login and test APIs
        login_data = {"username": self.landlord_user.username, "password": "TestLandlord2024!"}
        response = requests.post("http://localhost:8000/api/auth/login/", json=login_data)
        
        if response.status_code != 200:
            print(f"   ❌ Login failed")
            return
        
        token = response.json()["access"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Test Payment History
        response = requests.get("http://localhost:8000/api/auth/payments/history/", headers=headers)
        if response.status_code == 200:
            payments = response.json().get('payments', [])
            print(f"   ✅ Payment History: {len(payments)} payments found")
        
        # Test Payment Summary
        response = requests.get("http://localhost:8000/api/auth/payments/summary/", headers=headers)
        if response.status_code == 200:
            summary = response.json().get('summary', {})
            print(f"   ✅ Payment Summary: ${summary.get('current_month_total_dollars', 0)} this month")

    def print_summary(self):
        print("\n" + "="*50)
        print("🎯 FRESH TEST DATA COMPLETE!")
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
        
        print("\n🧪 TEST CREDENTIALS:")
        print(f"   Landlord: {self.landlord_user.username} / TestLandlord2024!")
        print(f"   Tenant: {self.tenant.user.username} / TestTenant2024!")
        
        print("\n🌐 FRONTEND TESTING:")
        print("   1. Go to: http://localhost:3001")
        print(f"   2. Login as landlord: {self.landlord_user.username}")
        print("   3. View payment dashboard")
        print("   4. Test tenant payment with card: 4242 4242 4242 4242")

def main():
    print("🚀 FINAL FRESH TEST DATA CREATION\n")
    
    creator = FreshTestDataCreator()
    
    try:
        creator.create_landlord_with_user()
        creator.create_property_and_room()
        creator.create_tenant_and_lease()
        creator.create_test_payments()
        creator.test_payment_apis()
        creator.print_summary()
        
        print("\n🎉 SUCCESS! Payment system ready for testing!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
