import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_reports():
    print("Testing Reports Summary...")
    resp = requests.get(f"{BASE_URL}/reports/summary")
    if resp.status_code == 200:
        print("Success:", resp.json())
    else:
        print("Failed:", resp.text)

def test_payroll_list():
    print("Testing Payroll List...")
    resp = requests.get(f"{BASE_URL}/payroll/")
    if resp.status_code == 200:
        print("Success: Found", len(resp.json()), "records")
    else:
        print("Failed:", resp.text)

if __name__ == "__main__":
    try:
        test_reports()
        test_payroll_list()
    except Exception as e:
        print("Error connecting to server:", e)
        print("Make sure the backend is running at", BASE_URL)
