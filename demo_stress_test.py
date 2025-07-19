"""
Aura Command Demo Stress Test Suite
This script verifies all features work flawlessly for the hackathon presentation.
"""

import requests
import time
import json
from typing import Dict, List

class AuraDemoTester:
    def __init__(self):
        self.backend_url = "http://127.0.0.1:8002"
        self.test_results = {"passed": 0, "failed": 0, "warnings": 0}
        
    def print_header(self, title: str):
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print(f"{'='*60}")
        
    def print_test(self, test_name: str, status: str, message: str = ""):
        icons = {"PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
        print(f"{icons.get(status, '🔍')} {test_name}: {status}")
        if message:
            print(f"   └─ {message}")
            
        if status == "PASS":
            self.test_results["passed"] += 1
        elif status == "FAIL":
            self.test_results["failed"] += 1
        else:
            self.test_results["warnings"] += 1
    
    def test_backend_connectivity(self):
        """Test 1: Backend Connectivity & Health"""
        self.print_header("Backend Connectivity & Health Check")
        
        try:
            # Test root endpoint
            response = requests.get(f"{self.backend_url}/", timeout=5)
            if response.status_code == 200:
                self.print_test("Root Endpoint", "PASS", f"Response: {response.json()}")
            else:
                self.print_test("Root Endpoint", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.print_test("Root Endpoint", "FAIL", f"Connection error: {e}")
            
        # Test routes endpoint
        try:
            response = requests.get(f"{self.backend_url}/api/v1/routes", timeout=5)
            if response.status_code == 200:
                data = response.json()
                route_count = len(data.get("routes", []))
                self.print_test("Routes Endpoint", "PASS", f"Routes available: {route_count}")
            else:
                self.print_test("Routes Endpoint", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.print_test("Routes Endpoint", "FAIL", f"Error: {e}")
    
    def test_ai_brief_generation(self):
        """Test 2: AI Brief Generation for All Scenarios"""
        self.print_header("AI Executive Brief Generation")
        
        scenarios = ["flood", "market_day", "graduation", "default"]
        
        for scenario in scenarios:
            try:
                start_time = time.time()
                response = requests.post(
                    f"{self.backend_url}/api/v1/generate_brief",
                    json={"scenario_id": scenario},
                    timeout=10
                )
                end_time = time.time()
                
                if response.status_code == 200:
                    data = response.json()
                    brief_length = len(data.get("brief", ""))
                    response_time = round((end_time - start_time) * 1000, 2)
                    
                    self.print_test(
                        f"AI Brief: {scenario.upper()}", 
                        "PASS", 
                        f"Length: {brief_length} chars, Time: {response_time}ms"
                    )
                    
                    # Warn if response is too slow for demo
                    if response_time > 2000:
                        self.print_test(
                            f"Performance Warning: {scenario}",
                            "WARN",
                            f"Response time {response_time}ms might be too slow for demo"
                        )
                else:
                    self.print_test(f"AI Brief: {scenario.upper()}", "FAIL", f"Status: {response.status_code}")
                    
            except Exception as e:
                self.print_test(f"AI Brief: {scenario.upper()}", "FAIL", f"Error: {e}")
    
    def test_data_validation(self):
        """Test 3: Data Structure Validation"""
        self.print_header("Data Structure & Content Validation")
        
        # Test route data structure
        try:
            response = requests.get(f"{self.backend_url}/api/v1/routes")
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["routes"]
                for field in required_fields:
                    if field in data:
                        self.print_test(f"Route Data: {field} field", "PASS")
                    else:
                        self.print_test(f"Route Data: {field} field", "FAIL", "Missing required field")
                
                # Check route structure
                if "routes" in data and len(data["routes"]) > 0:
                    route = data["routes"][0]
                    route_fields = ["route_name", "path_coordinates", "efficiency_gain_percent"]
                    
                    for field in route_fields:
                        if field in route:
                            self.print_test(f"Route Structure: {field}", "PASS")
                        else:
                            self.print_test(f"Route Structure: {field}", "FAIL", "Missing field")
                    
                    # Validate coordinates
                    coords = route.get("path_coordinates", [])
                    if len(coords) >= 2:
                        self.print_test("Route Coordinates", "PASS", f"{len(coords)} coordinate pairs")
                    else:
                        self.print_test("Route Coordinates", "FAIL", "Insufficient coordinates for route")
                        
        except Exception as e:
            self.print_test("Route Data Validation", "FAIL", f"Error: {e}")
    
    def run_full_test_suite(self):
        """Run all tests and provide summary"""
        print("🏆 AURA COMMAND DEMO STRESS TEST SUITE")
        print("Testing all features for hackathon presentation readiness...")
        
        # Run all test categories
        self.test_backend_connectivity()
        self.test_ai_brief_generation()
        self.test_data_validation()
        
        # Print final summary
        self.print_header("FINAL TEST SUMMARY")
        
        total_tests = sum(self.test_results.values())
        passed = self.test_results["passed"]
        failed = self.test_results["failed"]
        warnings = self.test_results["warnings"]
        
        print(f"📊 Total Tests Run: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        
        pass_rate = round((passed / total_tests) * 100, 1) if total_tests > 0 else 0
        print(f"📈 Pass Rate: {pass_rate}%")
        
        if failed == 0:
            print("\n🎉 ALL SYSTEMS GO! Demo is ready for presentation!")
        elif failed <= 2:
            print(f"\n⚠️  Minor issues detected. Review {failed} failed test(s) before demo.")
        else:
            print(f"\n🚨 CRITICAL ISSUES! Fix {failed} failed test(s) before demo!")
        
        print("\n🎯 Demo Readiness Checklist:")
        print("□ Backend server running on port 8002")
        print("□ Frontend server running on port 8503") 
        print("□ All AI scenarios tested and working")
        print("□ Voice command simulator tested")
        print("□ Network connection stable")

if __name__ == "__main__":
    tester = AuraDemoTester()
    tester.run_full_test_suite() 