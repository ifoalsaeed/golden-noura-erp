#!/usr/bin/env python3
"""
سكربت لاختبار نقطة نهاية تعديل المستخدم
"""

import requests
import json

def test_user_update():
    # بيانات الاختبار
    base_url = "http://localhost:8000/api/v1"
    
    # تسجيل الدخول أولاً
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        print("جاري تسجيل الدخول...")
        login_response = requests.post(f"{base_url}/auth/login", data=login_data)
        
        if login_response.status_code != 200:
            print(f"فشل تسجيل الدخول: {login_response.status_code}")
            print(login_response.text)
            return False
        
        token = login_response.json().get("access_token")
        print("تم تسجيل الدخول بنجاح")
        
        # جلب بيانات المستخدم الحالي
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{base_url}/auth/me", headers=headers)
        
        if me_response.status_code != 200:
            print(f"فشل جلب بيانات المستخدم: {me_response.status_code}")
            print(me_response.text)
            return False
        
        user_data = me_response.json()
        user_id = user_data.get("id")
        print(f"بيانات المستخدم الحالي: {user_data}")
        
        # اختبار تعديل المستخدم
        update_data = {
            "full_name": "السعيد الوزان",
            "role": "ADMIN"
        }
        
        print(f"جاري تعديل المستخدم {user_id}...")
        update_response = requests.put(
            f"{base_url}/users/{user_id}/profile", 
            json=update_data,
            headers=headers
        )
        
        print(f"حالة الاستجابة: {update_response.status_code}")
        print(f"الاستجابة: {update_response.text}")
        
        if update_response.status_code == 200:
            print("✅ تم تعديل المستخدم بنجاح")
            return True
        else:
            print("❌ فشل تعديل المستخدم")
            return False
            
    except Exception as e:
        print(f"حدث خطأ: {e}")
        return False

if __name__ == "__main__":
    print("اختبار نقطة نهاية تعديل المستخدم...")
    success = test_user_update()
    
    if success:
        print("\n✅ الاختبار نجح!")
    else:
        print("\n❌ الاختبار فشل!")
