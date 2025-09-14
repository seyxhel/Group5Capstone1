#!/usr/bin/env python3
"""
Quick test script for secure media implementation
Run this to verify your deployed secure media is working
"""

import requests
import sys
import json
from urllib.parse import urlparse

# Configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
BASE_URL = "https://smartsupport-hdts-backend.up.railway.app"
TEST_EMAIL = "your-test-employee@example.com"  # Replace with actual test email
TEST_PASSWORD = "your-test-password"          # Replace with actual test password
EXTERNAL_API_KEY = "your-external-api-key"    # Replace with your actual API key

def test_authentication():
    """Test if we can authenticate and get a token"""
    print("🔐 Testing authentication...")
    
    login_url = f"{BASE_URL}/api/token/employee/"
    login_data = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    
    try:
        response = requests.post(login_url, json=login_data, timeout=10)
        if response.status_code == 200:
            token = response.json().get("access")
            print("✅ Authentication successful")
            return token
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def test_profile_secure_urls(token):
    """Test if profile endpoint returns secure URLs"""
    print("\n📷 Testing profile image secure URLs...")
    
    profile_url = f"{BASE_URL}/api/employee/profile/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(profile_url, headers=headers, timeout=10)
        if response.status_code == 200:
            profile_data = response.json()
            image_url = profile_data.get("image")
            
            if image_url:
                if "token=" in image_url:
                    print("✅ Profile image URL includes security token")
                    return image_url
                else:
                    print("⚠️ Profile image URL doesn't include token - might not be secure")
                    return image_url
            else:
                print("ℹ️ No profile image found")
                return None
        else:
            print(f"❌ Profile request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Profile request error: {e}")
        return None

def test_secure_access(secure_url):
    """Test accessing media with secure URL"""
    if not secure_url:
        return
    
    print("\n🔒 Testing secure media access...")
    
    try:
        response = requests.get(secure_url, timeout=10)
        if response.status_code == 200:
            print("✅ Secure media access works")
            print(f"   Content-Type: {response.headers.get('Content-Type', 'unknown')}")
            print(f"   Content-Length: {response.headers.get('Content-Length', 'unknown')} bytes")
        else:
            print(f"❌ Secure media access failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Secure media access error: {e}")

def test_unauthenticated_access(secure_url):
    """Test that unauthenticated access is blocked"""
    if not secure_url:
        return
    
    print("\n🚫 Testing unauthenticated access (should be blocked)...")
    
    # Remove token from URL
    parsed_url = urlparse(secure_url)
    public_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
    
    try:
        response = requests.get(public_url, timeout=10)
        if response.status_code == 403:
            print("✅ Unauthenticated access properly blocked")
        elif response.status_code == 401:
            print("✅ Unauthenticated access properly blocked (401)")
        else:
            print(f"❌ SECURITY ISSUE: Unauthenticated access allowed! Status: {response.status_code}")
            print("   This is a security vulnerability!")
    except Exception as e:
        print(f"❌ Unauthenticated access test error: {e}")

def test_api_key_access(secure_url):
    """Test external system access with API key"""
    if not secure_url or not EXTERNAL_API_KEY or EXTERNAL_API_KEY == "your-external-api-key":
        print("\n⚠️ Skipping API key test - no API key configured")
        return
    
    print("\n🔑 Testing external system API key access...")
    
    # Remove token and add API key
    parsed_url = urlparse(secure_url)
    api_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?api_key={EXTERNAL_API_KEY}"
    
    try:
        response = requests.get(api_url, timeout=10)
        if response.status_code == 200:
            print("✅ API key access works")
        else:
            print(f"❌ API key access failed: {response.status_code}")
    except Exception as e:
        print(f"❌ API key access error: {e}")

def test_ticket_attachments(token):
    """Test ticket attachment URLs"""
    print("\n📎 Testing ticket attachments...")
    
    tickets_url = f"{BASE_URL}/api/tickets/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(tickets_url, headers=headers, timeout=10)
        if response.status_code == 200:
            tickets = response.json()
            
            # Look for tickets with attachments
            attachment_found = False
            for ticket in tickets.get('results', tickets) if isinstance(tickets, dict) else tickets:
                attachments = ticket.get('attachments', [])
                if attachments:
                    attachment_found = True
                    attachment_url = attachments[0].get('file')
                    if attachment_url and "token=" in attachment_url:
                        print("✅ Ticket attachment URLs include security tokens")
                        return attachment_url
                    elif attachment_url:
                        print("⚠️ Ticket attachment URLs don't include tokens")
                        return attachment_url
                    break
            
            if not attachment_found:
                print("ℹ️ No ticket attachments found to test")
                return None
        else:
            print(f"❌ Tickets request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Tickets request error: {e}")
        return None

def main():
    print("🚀 Testing Secure Media Implementation on Railway Deployment")
    print("=" * 60)
    
    # Check configuration
    if TEST_EMAIL == "your-test-employee@example.com":
        print("⚠️ Please update TEST_EMAIL and TEST_PASSWORD in this script with actual test credentials")
        print("   You can use any valid employee account from your system")
        return
    
    # Test 1: Authentication
    token = test_authentication()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    # Test 2: Profile secure URLs
    profile_image_url = test_profile_secure_urls(token)
    
    # Test 3: Secure access
    test_secure_access(profile_image_url)
    
    # Test 4: Unauthenticated access
    test_unauthenticated_access(profile_image_url)
    
    # Test 5: API key access
    test_api_key_access(profile_image_url)
    
    # Test 6: Ticket attachments
    attachment_url = test_ticket_attachments(token)
    if attachment_url:
        print("\n📎 Testing ticket attachment access...")
        test_secure_access(attachment_url)
        test_unauthenticated_access(attachment_url)
    
    print("\n" + "=" * 60)
    print("🏁 Testing complete!")
    print("\nIf you see ✅ for most tests, your secure media implementation is working!")
    print("If you see ❌, check the error messages and your deployment configuration.")

if __name__ == "__main__":
    main()
