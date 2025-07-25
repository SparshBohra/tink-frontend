#!/usr/bin/env python3
import requests
import time
import os
import sys
from datetime import datetime, date

BASE_URL = "http://localhost:8000"
LANDLORD_CREDENTIALS = {"username": "david_ggpg", "password": "GoldenGate2024!"}

def create_manual_payment_record():
    print("📝 Creating manual payment record...")
    
    backend_path = "/Users/sparshbohra/tink-project/tink/tink-backend"
    sys.path.append(backend_path)
    os.chdir(backend_path)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    
    try:
        import django
        django.setup()
        
        from accounts.models import Payment, Landlord
        from tenants.models import Tenant, Lease
        from django.utils import timezone
        
        # Get test data
        landlord = Landlord.objects.first()
        tenant = Tenant.objects.first()
        lease = Lease.objects.first()
        
        if not all([landlord, tenant, lease]):
            print("   ❌ Missing required objects")
            return
        
        # Create 3 test payments
        payments_created = 0
        for i in range(3):
            payment = Payment.objects.create(
                stripe_payment_intent_id=f"pi_test_{int(time.time())}_{i}",
                stripe_charge_id=f"ch_test_{int(time.time())}_{i}",
                landlord=landlord,
                tenant=tenant,
                lease=lease,
                property_ref=lease.property_ref,
                amount_cents=125000 + (i * 5000),  # $1250, $1300, $1350
                status=Payment.PaymentStatus.SUCCEEDED,
                rent_period_start=date(2024, 1+i, 1),
                rent_period_end=date(2024, 1+i, 28),
                payment_date=timezone.now(),
                stripe_fee_cents=3625 + (i * 145),
                application_fee_cents=0,
                net_amount_cents=121375 + (i * 4855),
                description=f"Test rent payment #{i+1}",
                metadata={"test_payment": True, "batch": i+1}
            )
            payments_created += 1
            print(f"   ✅ Payment {i+1}: ${payment.amount_dollars} - ID {payment.id}")
        
        print(f"\n🎉 Created {payments_created} test payments!")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

def main():
    print("🧪 CREATING TEST PAYMENTS\n")
    create_manual_payment_record()
    print("\n🎯 Done! Check database now.")

if __name__ == "__main__":
    main()
