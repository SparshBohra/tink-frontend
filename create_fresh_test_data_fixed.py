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
        
        username = f"fresh_landlord_{int(time.time())}"
        user = User.objects.create_user(
            username=username,
            email=f"{username}@testlandlord.com",
            password="TestLandlord2024!",
            first_name="Fresh",
            last_name="Landlord"
        )
        
        self.landlord = Landlord.objects.create(
            org_name="Fresh Test Properties LLC",
            contact_email=user.email,
            contact_phone="555-FRESH-001", 
            address="123 Fresh Test Street, Test City, TC 12345",
            stripe_account_id=f"acct_fresh_{int(time.time())}",
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
        
        # Create property with correct field names
        self.property = Property.objects.create(
            name="Fresh Test Apartments",
            landlord=self.landlord,
            property_type="apartment",
            rent_type="monthly",
            total_rooms=4,
            monthly_rent=1500.00,
            security_deposit=1500.00,
            address_line1="456 Payment Test Ave",
            address_line2="Unit 100",
            city="Test City", 
            state="TC",
            postal_code="54321",
            country="US",
            timezone="America/New_York"
        )
        
        self.room = Room.objects.create(
            property_ref=self.property,
            name="Fresh Test Room A1",
            room_type="single",
            monthly_rent=1500.00,
            security_deposit=1500.00,
            available=False,
            description="Fresh test room for payment verification"
        )
        
        print(f"   ✅ Created property: {self.property.name}")
        print(f"   ✅ Created room: {self.room.name}")
        
        return self.property, self.room

    def create_tenant_and_lease(self):
        print("👤 Creating tenant and lease...")
        
        tenant_username = f"fresh_tenant_{int(time.time())}"
        tenant_user = User.objects.create_user(
            username=tenant_username,
            email=f"{tenant_username}@testtenant.com",
            password="TestTenant2024!",
            first_name="Fresh",
            last_name="Tenant"
        )
        
        self.tenant = Tenant.objects.create(
            user=tenant_user,
            phone_number="555-FRESH-TENANT",
            date_of_birth=date(1992, 5, 15),
            emergency_contact_name="Fresh Emergency Contact",
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
        print(f"   ✅ Created lease: Active until {self.lease.end_date}")
        
        return self.tenant, self.lease

    def create_test_payments(self):
        print("💳 Creating comprehensive test payments...")
        
        # Create realistic payment scenarios
        today = date.today()
        current_month = today.replace(day=1)
        
        payment_scenarios = [
            {
                "amount": 1500, 
                "status": Payment.PaymentStatus.SUCCEEDED,
                "period": current_month - timedelta(days=90),
                "desc": "December 2024 rent - PAID ON TIME",
                "days_ago": 85
            },
            {
                "amount": 1500,
                "status": Payment.PaymentStatus.SUCCEEDED, 
                "period": current_month - timedelta(days=60),
                "desc": "January 2025 rent - PAID ON TIME",
                "days_ago": 55
            },
            {
                "amount": 1500,
                "status": Payment.PaymentStatus.SUCCEEDED,
                "period": current_month - timedelta(days=30), 
                "desc": "February 2025 rent - PAID ON TIME",
                "days_ago": 25
            },
            {
                "amount": 750,
                "status": Payment.PaymentStatus.SUCCEEDED,
                "period": current_month,
                "desc": "March 2025 rent - PARTIAL PAYMENT (1/2)",
                "days_ago": 5
            },
            {
                "amount": 750,
                "status": Payment.PaymentStatus.PENDING,
                "period": current_month,
                "desc": "March 2025 rent - PARTIAL PAYMENT (2/2) - PENDING",
                "days_ago": 1
            },
            {
                "amount": 200,
                "status": Payment.PaymentStatus.FAILED,
                "period": current_month + timedelta(days=30),
                "desc": "April 2025 rent - FAILED ATTEMPT (insufficient funds)",
                "days_ago": 0
            }
        ]
        
        for i, scenario in enumerate(payment_scenarios):
            period_start = scenario["period"]
            period_end = period_start + timedelta(days=28)
            
            # Calculate realistic fees
            amount_cents = int(scenario["amount"] * 100)
            stripe_fee_cents = int(amount_cents * 0.029 + 30)  # 2.9% + 30¢
            net_amount_cents = amount_cents - stripe_fee_cents
            
            payment_date = timezone.now() - timedelta(days=scenario["days_ago"])
            due_date = period_start + timedelta(days=1)  # Due on 1st of month
            
            payment = Payment.objects.create(
                stripe_payment_intent_id=f"pi_fresh_{int(time.time())}_{i}",
                stripe_charge_id=f"ch_fresh_{int(time.time())}_{i}" if scenario["status"] == Payment.PaymentStatus.SUCCEEDED else "",
                landlord=self.landlord,
                tenant=self.tenant,
                lease=self.lease,
                property_ref=self.property,
                amount_cents=amount_cents,
                status=scenario["status"],
                rent_period_start=period_start,
                rent_period_end=period_end,
                payment_date=payment_date,
                due_date=due_date,
                stripe_fee_cents=stripe_fee_cents,
                application_fee_cents=0,
                net_amount_cents=net_amount_cents,
                description=scenario["desc"],
                metadata={
                    "test_payment": True,
                    "fresh_test_data": True,
                    "scenario": i + 1,
                    "payment_method": "test_card"
                }
            )
            
            self.payments.append(payment)
            
            status_emoji = {"succeeded": "✅", "pending": "⏳", "failed": "❌"}
            late_indicator = "🚨 LATE" if payment.is_late_payment else ""
            
            print(f"   {status_emoji[scenario['status']]} Payment {i+1}: ${payment.amount_dollars}")
            print(f"      Status: {scenario['status'].upper()} {late_indicator}")
            print(f"      Period: {period_start.strftime('%b %Y')}")
            print(f"      Net to landlord: ${payment.net_amount_dollars}")
        
        print(f"\n🎉 Created {len(self.payments)} comprehensive test payments!")
        return self.payments

    def test_payment_apis(self):
        print("\n🧪 Testing Payment APIs with fresh data...")
        
        # Login as the fresh landlord
        login_data = {
            "username": self.landlord_user.username,
            "password": "TestLandlord2024!"
        }
        
        response = requests.post("http://localhost:8000/api/auth/login/", json=login_data)
        if response.status_code != 200:
            print(f"   ❌ Login failed: {response.text}")
            return
        
        token = response.json()["access"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        print(f"   ✅ Logged in as: {self.landlord_user.username}")
        
        # Test Payment History API
        print("\n1️⃣ Testing Payment History API...")
        response = requests.get("http://localhost:8000/api/auth/payments/history/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            payments = data.get('payments', [])
            print(f"   ✅ Found {len(payments)} payments in history")
            
            # Show detailed payment info
            for payment in payments[:3]:
                status_emoji = {"succeeded": "✅", "pending": "⏳", "failed": "❌"}
                emoji = status_emoji.get(payment['status'], "❓")
                print(f"      {emoji} ${payment['amount_dollars']} - {payment['status']} - {payment['description'][:40]}...")
        else:
            print(f"   ❌ Payment History Error: {response.text}")
        
        # Test Payment Summary API  
        print("\n2️⃣ Testing Payment Summary API...")
        response = requests.get("http://localhost:8000/api/auth/payments/summary/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            summary = data.get('summary', {})
            recent = data.get('recent_payments', [])
            
            print(f"   ✅ This month total: ${summary.get('current_month_total_dollars', 0)}")
            print(f"   ✅ Last 30 days total: ${summary.get('last_30_days_total_dollars', 0)}")
            print(f"   ✅ Total successful payments: {summary.get('total_successful_payments', 0)}")
            print(f"   ✅ Pending payments: {summary.get('pending_payments', 0)}")
            print(f"   ✅ Failed payments: {summary.get('failed_payments', 0)}")
            print(f"   ✅ Recent payments listed: {len(recent)}")
        else:
            print(f"   ❌ Payment Summary Error: {response.text}")

        # Test Create Payment Intent API
        print("\n3️⃣ Testing Create Payment Intent API...")
        payment_intent_data = {
            "lease_id": self.lease.id,
            "amount": 1500,
            "rent_period_start": date.today().strftime("%Y-%m-01")
        }
        
        response = requests.post("http://localhost:8000/api/auth/payments/create-intent/", 
                               json=payment_intent_data, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Payment intent created successfully!")
            print(f"      Intent ID: {data.get('payment_intent_id', 'N/A')}")
            print(f"      Amount: ${data.get('amount_dollars', 0)}")
            print(f"      Client Secret: {data.get('client_secret', 'N/A')[:25]}...")
            print(f"      Ready for Stripe.js frontend!")
        else:
            print(f"   ❌ Payment Intent Error: {response.text}")

    def print_summary(self):
        print("\n" + "="*60)
        print("🎯 FRESH TEST DATA CREATION COMPLETE!")
        print("="*60)
        
        print(f"👤 Landlord User: {self.landlord_user.username}")
        print(f"🏢 Organization: {self.landlord.org_name}")
        print(f"🏠 Property: {self.property.name}")
        print(f"🚪 Room: {self.room.name}")
        print(f"👨‍💼 Tenant: {self.tenant.user.get_full_name()}")
        print(f"📝 Lease: Active (${self.lease.monthly_rent}/month)")
        print(f"💳 Payments: {len(self.payments)} created")
        
        # Payment statistics
        succeeded = len([p for p in self.payments if p.status == 'succeeded'])
        pending = len([p for p in self.payments if p.status == 'pending'])
        failed = len([p for p in self.payments if p.status == 'failed'])
        
        total_revenue = sum(p.amount_dollars for p in self.payments if p.status == 'succeeded')
        pending_amount = sum(p.amount_dollars for p in self.payments if p.status == 'pending')
        
        print()
        print("📊 Payment Statistics:")
        print(f"   ✅ Succeeded: {succeeded} payments (${total_revenue})")
        print(f"   ⏳ Pending: {pending} payments (${pending_amount})")
        print(f"   ❌ Failed: {failed} payments")
        
        print()
        print("🧪 TEST CREDENTIALS FOR FRONTEND:")
        print(f"   Landlord Login: {self.landlord_user.username} / TestLandlord2024!")
        print(f"   Tenant Login: {self.tenant.user.username} / TestTenant2024!")
        
        print()
        print("🌐 FRONTEND TESTING WORKFLOW:")
        print("   1. Go to: http://localhost:3001")
        print(f"   2. Login as landlord: {self.landlord_user.username}")
        print("   3. Navigate to payments/dashboard to see analytics")
        print("   4. Logout and login as tenant")
        print("   5. Navigate to tenant-payments")
        print("   6. Click 'Pay Now' and use test card: 4242 4242 4242 4242")
        print("   7. Complete payment and verify it appears in landlord dashboard")
        
        print()
        print("✨ The payment system is now fully populated with realistic test data!")
        print("   Ready for comprehensive end-to-end testing! 🚀")

def main():
    print("🚀 CREATING COMPREHENSIVE FRESH TEST DATA\n")
    
    creator = FreshTestDataCreator()
    
    try:
        # Create complete test ecosystem
        creator.create_landlord_with_user()
        creator.create_property_and_room()
        creator.create_tenant_and_lease()
        creator.create_test_payments()
        
        # Test all payment APIs
        creator.test_payment_apis()
        
        # Print comprehensive summary
        creator.print_summary()
        
        print("\n🎉 SUCCESS! Fresh test data creation complete!")
        print("Payment system ready for end-to-end testing! 🚀")
        
    except Exception as e:
        print(f"\n❌ Error creating fresh test data: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
