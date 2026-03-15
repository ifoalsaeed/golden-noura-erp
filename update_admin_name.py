#!/usr/bin/env python3
"""
سكربت لتحديث اسم المستخدم admin في قاعدة البيانات
"""

import sqlite3
import os

def update_admin_name():
    # تحديد مسار قاعدة البيانات
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'sql_app.db')
    
    if not os.path.exists(db_path):
        print(f"قاعدة البيانات غير موجودة في: {db_path}")
        return False
    
    try:
        # الاتصال بقاعدة البيانات
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # تحديث اسم المستخدم admin
        cursor.execute("""
            UPDATE users 
            SET full_name = 'السعيد الوزان' 
            WHERE username = 'admin' AND (full_name IS NULL OR full_name = '')
        """)
        
        # التحقق من عدد الصفوف المتأثرة
        affected_rows = cursor.rowcount
        
        if affected_rows > 0:
            print(f"تم تحديث {affected_rows} صفوف بنجاح")
            conn.commit()
            print("تم تحديث اسم المستخدم admin إلى 'السعيد الوزان' بنجاح")
        else:
            print("المستخدم admin لديه بالفعل اسم كامل أو غير موجود")
        
        # عرض البيانات الحالية للمستخدم admin
        cursor.execute("SELECT id, username, full_name, role FROM users WHERE username = 'admin'")
        admin_data = cursor.fetchone()
        
        if admin_data:
            print(f"\nبيانات المستخدم admin الحالية:")
            print(f"ID: {admin_data[0]}")
            print(f"Username: {admin_data[1]}")
            print(f"Full Name: {admin_data[2]}")
            print(f"Role: {admin_data[3]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"حدث خطأ: {e}")
        return False

if __name__ == "__main__":
    print("جاري تحديث اسم المستخدم admin...")
    success = update_admin_name()
    
    if success:
        print("\n✅ تم العملية بنجاح!")
        print("\nالخطوات التالية:")
        print("1. أعد تشغيل الخادم الخلفي")
        print("2. سجل الخروج من النظام")
        print("3. سجل الدخول مرة أخرى")
        print("4. ستجد رسالة الترحيب بالاسم الكامل")
    else:
        print("\n❌ فشلت العملية")
