#!/usr/bin/env python3
"""
Employee Attendance Dashboard Backend API Tests
Tests all API endpoints for the attendance management system
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Base URL from environment
BASE_URL = "http://localhost:3000/api"

def test_api_endpoint(endpoint, method="GET", params=None, data=None, expected_status=200):
    """Generic function to test API endpoints"""
    try:
        url = f"{BASE_URL}/{endpoint}"
        
        if method == "GET":
            response = requests.get(url, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
            
        print(f"Testing {method} {endpoint}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != expected_status:
            print(f"❌ Expected status {expected_status}, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        try:
            json_response = response.json()
            print(f"✅ Response: {json.dumps(json_response, indent=2)[:200]}...")
            return True, json_response
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_database_connection():
    """Test database connection endpoint"""
    print("\n" + "="*50)
    print("Testing Database Connection")
    print("="*50)
    
    result = test_api_endpoint("test")
    if result and len(result) > 1:
        response_data = result[1]
        if response_data.get('success') and 'currentTime' in str(response_data):
            print("✅ Database connection test PASSED")
            return True
    
    print("❌ Database connection test FAILED")
    return False

def test_attendance_today():
    """Test today's attendance endpoint"""
    print("\n" + "="*50)
    print("Testing Today's Attendance")
    print("="*50)
    
    result = test_api_endpoint("attendance/today")
    if result and len(result) > 1:
        response_data = result[1]
        if response_data.get('success') and 'data' in response_data:
            data = response_data['data']
            print(f"✅ Today's attendance test PASSED - Found {len(data)} records")
            
            # Check data structure if records exist
            if data and len(data) > 0:
                first_record = data[0]
                required_fields = ['pin', 'scan_date', 'pegawai_nama']
                missing_fields = [field for field in required_fields if field not in first_record]
                if missing_fields:
                    print(f"⚠️  Missing fields in response: {missing_fields}")
                else:
                    print("✅ All required fields present in response")
            return True
    
    print("❌ Today's attendance test FAILED")
    return False

def test_attendance_stats():
    """Test attendance statistics endpoint"""
    print("\n" + "="*50)
    print("Testing Attendance Statistics")
    print("="*50)
    
    result = test_api_endpoint("attendance/stats")
    if result and len(result) > 1:
        response_data = result[1]
        if response_data.get('success') and 'data' in response_data:
            data = response_data['data']
            required_fields = ['total', 'present', 'absent', 'byPembagian1', 'byPembagian2']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print(f"✅ Attendance stats test PASSED")
                print(f"   Total employees: {data['total']}")
                print(f"   Present today: {data['present']}")
                print(f"   Absent today: {data['absent']}")
                return True
            else:
                print(f"❌ Missing fields in stats response: {missing_fields}")
    
    print("❌ Attendance statistics test FAILED")
    return False

def test_live_attendance():
    """Test live attendance logs endpoint"""
    print("\n" + "="*50)
    print("Testing Live Attendance Logs")
    print("="*50)
    
    # Test with default limit
    result = test_api_endpoint("attendance/live")
    if result and len(result) > 1:
        response_data = result[1]
        if response_data.get('success') and 'data' in response_data:
            print("✅ Live attendance (default) test PASSED")
            
            # Test with custom limit
            result2 = test_api_endpoint("attendance/live", params={'limit': 20})
            if result2 and len(result2) > 1:
                response_data2 = result2[1]
                if response_data2.get('success'):
                    data = response_data2['data']
                    print(f"✅ Live attendance (limit=20) test PASSED - Found {len(data)} records")
                    
                    # Check data structure if records exist
                    if data and len(data) > 0:
                        first_record = data[0]
                        required_fields = ['pin', 'scan_date', 'inoutmode']
                        missing_fields = [field for field in required_fields if field not in first_record]
                        if missing_fields:
                            print(f"⚠️  Missing fields in response: {missing_fields}")
                        else:
                            print("✅ All required fields present in response")
                    return True
    
    print("❌ Live attendance test FAILED")
    return False

def test_employees_list():
    """Test employees list endpoint"""
    print("\n" + "="*50)
    print("Testing Employees List")
    print("="*50)
    
    result = test_api_endpoint("employees")
    if result and len(result) > 1:
        response_data = result[1]
        if response_data.get('success') and 'data' in response_data:
            data = response_data['data']
            print(f"✅ Employees list test PASSED - Found {len(data)} employees")
            
            # Check data structure if records exist
            if data and len(data) > 0:
                first_record = data[0]
                required_fields = ['pegawai_pin', 'pegawai_nama', 'pegawai_nip']
                missing_fields = [field for field in required_fields if field not in first_record]
                if missing_fields:
                    print(f"⚠️  Missing fields in response: {missing_fields}")
                else:
                    print("✅ All required fields present in response")
            return True
    
    print("❌ Employees list test FAILED")
    return False

def test_personal_report():
    """Test personal attendance report endpoint"""
    print("\n" + "="*50)
    print("Testing Personal Attendance Report")
    print("="*50)
    
    # Test with missing parameters (should fail)
    result = test_api_endpoint("reports/personal", expected_status=400)
    if result and len(result) > 1:
        response_data = result[1]
        if not response_data.get('success') and 'Missing required parameters' in response_data.get('error', ''):
            print("✅ Personal report validation test PASSED (missing params)")
        else:
            print("❌ Personal report validation test FAILED")
            return False
    
    # Test with valid parameters
    params = {
        'pin': '1131',
        'startDate': '2025-01-20',
        'endDate': '2025-01-25'
    }
    
    result = test_api_endpoint("reports/personal", params=params)
    if result and len(result) > 1:
        response_data = result[1]
        if response_data.get('success') and 'data' in response_data:
            data = response_data['data']
            print(f"✅ Personal report test PASSED - Found {len(data)} records for PIN 1131")
            return True
    
    print("❌ Personal report test FAILED")
    return False

def test_unit_report():
    """Test unit attendance report endpoint"""
    print("\n" + "="*50)
    print("Testing Unit Attendance Report")
    print("="*50)
    
    # Test with missing parameters (should fail)
    result = test_api_endpoint("reports/unit", expected_status=400)
    if result and len(result) > 1:
        response_data = result[1]
        if not response_data.get('success') and 'Missing required parameters' in response_data.get('error', ''):
            print("✅ Unit report validation test PASSED (missing params)")
        else:
            print("❌ Unit report validation test FAILED")
            return False
    
    # Test with valid parameters for pembagian1
    params = {
        'type': 'pembagian1',
        'id': '1',
        'startDate': '2025-01-20',
        'endDate': '2025-01-25'
    }
    
    result = test_api_endpoint("reports/unit", params=params)
    if result and len(result) > 1:
        response_data = result[1]
        if response_data.get('success') and 'data' in response_data:
            data = response_data['data']
            print(f"✅ Unit report (pembagian1) test PASSED - Found {len(data)} employees")
            
            # Test pembagian2 as well
            params['type'] = 'pembagian2'
            result2 = test_api_endpoint("reports/unit", params=params)
            if result2 and len(result2) > 1:
                response_data2 = result2[1]
                if response_data2.get('success'):
                    data2 = response_data2['data']
                    print(f"✅ Unit report (pembagian2) test PASSED - Found {len(data2)} employees")
                    return True
    
    print("❌ Unit report test FAILED")
    return False

def test_categories():
    """Test categories endpoints"""
    print("\n" + "="*50)
    print("Testing Categories Endpoints")
    print("="*50)
    
    # Test pembagian1 categories
    result1 = test_api_endpoint("categories/pembagian1")
    pembagian1_success = False
    if result1 and len(result1) > 1:
        response_data = result1[1]
        if response_data.get('success') and 'data' in response_data:
            data = response_data['data']
            print(f"✅ Pembagian1 categories test PASSED - Found {len(data)} categories")
            pembagian1_success = True
        else:
            print("❌ Pembagian1 categories test FAILED")
    
    # Test pembagian2 categories
    result2 = test_api_endpoint("categories/pembagian2")
    pembagian2_success = False
    if result2 and len(result2) > 1:
        response_data = result2[1]
        if response_data.get('success') and 'data' in response_data:
            data = response_data['data']
            print(f"✅ Pembagian2 categories test PASSED - Found {len(data)} categories")
            pembagian2_success = True
        else:
            print("❌ Pembagian2 categories test FAILED")
    
    return pembagian1_success and pembagian2_success

def test_invalid_endpoint():
    """Test invalid endpoint handling"""
    print("\n" + "="*50)
    print("Testing Invalid Endpoint Handling")
    print("="*50)
    
    result = test_api_endpoint("invalid/endpoint", expected_status=404)
    if result and len(result) > 1:
        response_data = result[1]
        if not response_data.get('success') and 'not found' in response_data.get('error', '').lower():
            print("✅ Invalid endpoint test PASSED")
            return True
    
    print("❌ Invalid endpoint test FAILED")
    return False

def main():
    """Run all backend API tests"""
    print("🚀 Starting Employee Attendance Dashboard Backend API Tests")
    print("=" * 70)
    
    test_results = []
    
    # Run all tests
    tests = [
        ("Database Connection", test_database_connection),
        ("Today's Attendance", test_attendance_today),
        ("Attendance Statistics", test_attendance_stats),
        ("Live Attendance Logs", test_live_attendance),
        ("Employees List", test_employees_list),
        ("Personal Report", test_personal_report),
        ("Unit Report", test_unit_report),
        ("Categories", test_categories),
        ("Invalid Endpoint", test_invalid_endpoint)
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            test_results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test FAILED with exception: {str(e)}")
            test_results.append((test_name, False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal Tests: {len(test_results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/len(test_results)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 All backend API tests PASSED!")
        return True
    else:
        print(f"\n⚠️  {failed} test(s) FAILED. Please check the logs above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)