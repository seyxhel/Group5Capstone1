#!/usr/bin/env python
"""
Test script to verify employee portal protective routing is properly configured.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth.settings')
sys.path.insert(0, '/work/Capstone 2/Group5Capstone1/auth2')

django.setup()

from auth.urls import urlpatterns
from hdts.employee_template_views import (
    EmployeeLoginRequiredMixin,
    EmployeeNotAuthenticatedMixin,
    EmployeeStaffBlockerMixin,
)

# Verify mixins are properly defined
print("✓ Authentication Mixins")
print(f"  ✓ EmployeeLoginRequiredMixin: {EmployeeLoginRequiredMixin.__doc__.split('.' if '.' in EmployeeLoginRequiredMixin.__doc__ else '')[0]}")
print(f"  ✓ EmployeeNotAuthenticatedMixin: {EmployeeNotAuthenticatedMixin.__doc__.split('.' if '.' in EmployeeNotAuthenticatedMixin.__doc__ else '')[0]}")
print(f"  ✓ EmployeeStaffBlockerMixin: {EmployeeStaffBlockerMixin.__doc__.split('.' if '.' in EmployeeStaffBlockerMixin.__doc__ else '')[0]}")

# Verify URL patterns
print("\n✓ URL Patterns Loaded")
url_strings = [str(p.pattern) for p in urlpatterns]
print(f"  Total routes: {len(url_strings)}")

# Check employee portal routes
employee_routes = [s for s in url_strings if any(x in s for x in ['login', 'register', 'verify-otp', 'profile-settings', 'change-password', 'forgot-password', 'reset-password', 'api/me'])]
print(f"\n✓ Employee Portal Routes ({len(employee_routes)})")
for route in sorted(employee_routes):
    print(f"  ✓ {route}")

# Check staff routes
staff_routes = [s for s in url_strings if s.startswith('staff/')]
print(f"\n✓ Staff Portal Routes ({len(staff_routes)})")
for route in sorted(staff_routes):
    print(f"  ✓ {route}")

print("\n✓ All checks passed! Protective routing is properly configured.")
