import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ar: {
    translation: {
      // Navigation
      "Dashboard": "لوحة القيادة",
      "Workers": "العمال",
      "Clients": "العملاء",
      "Contracts": "العقود",
      "Payroll": "الرواتب",
      "Expenses": "المصروفات",
      "Accounting": "المحاسبة",
      "Reports": "التقارير",
      "Settings": "الإعدادات",

      // Auth
      "Login": "تسجيل الدخول",
      "Logout": "تسجيل الخروج",
      "Username": "اسم المستخدم",
      "Password": "كلمة المرور",
      "Welcome back": "مرحباً بعودتك",
      "Golden Noura ERP": "نظام نور الذهبي",
      "Invalid username or password": "اسم المستخدم أو كلمة المرور غير صحيحة",
      "Connection error. Use admin / admin123 to login.": "خطأ في الاتصال. استخدم admin / admin123 للدخول",

      // Dashboard
      "Total Workers": "إجمالي العمال",
      "Active Workers": "عمال نشطون",
      "Monthly Revenue": "الإيراد الشهري",
      "Net Profit": "صافي الربح",
      "Financial Overview": "نظرة عامة مالية",
      "System Settings": "إعدادات النظام",

      // Workers page
      "Add Worker": "إضافة عامل",
      "Search workers...": "بحث عن عمال...",
      "Name": "الاسم",
      "Nationality": "الجنسية",
      "Profession": "المهنة",
      "Status": "الحالة",
      "Action": "الإجراء",
      "No workers database rows yet. Backend fully connected!": "لا يوجد عمال بعد. السيرفر متصل!",

      // Clients page
      "Add Client": "إضافة عميل",
      "Search clients...": "بحث عن عملاء...",
      "Company Name": "اسم الشركة",
      "Contact Person": "المسؤول",
      "Phone": "الهاتف",
      "No clients added yet.": "لا يوجد عملاء بعد.",

      // Contracts page
      "New Contract": "عقد جديد",
      "Search contracts...": "بحث في العقود...",
      "Contract #": "رقم العقد",
      "Client": "العميل",
      "Worker": "العامل",
      "Rental Price": "سعر الإيجار",
      "No active contracts yet.": "لا توجد عقود نشطة بعد.",

      // Expenses page
      "Add Expense": "إضافة مصروف",
      "Monthly Expenses": "المصروفات الشهرية",
      "Category": "الفئة",
      "Amount": "المبلغ",
      "Description": "الوصف",
      "General": "عام",
      "Salaries": "رواتب",
      "Rent": "إيجار",
      "Maintenance": "صيانة",
      "Government Fees": "رسوم حكومية",
      "Utilities": "خدمات (كهرباء/ماء)",
      "Other": "أخرى",
      "Enter details...": "أدخل التفاصيل...",

      // Payroll page
      "Process Payroll": "معالجة الرواتب",
      "Period": "الفترة",
      "Net Salary": "صافي الراتب",
      "Paid": "تم الدفع",
      "Processing": "جاري المعالجة",
      "View Details": "عرض التفاصيل",
      "Select Worker": "اختر العامل",
      "Month": "الشهر",
      "Year": "السنة",
      "Bonuses": "مكافآت",
      "Deductions": "خصومات",

      // Reports page
      "Reports Overview": "نظرة عامة على التقارير",
      "Export to Excel": "تصدير إلى إكسل",
      "Revenue vs Expenses": "الإيرادات مقابل المصروفات",

      // Common
      "Search": "بحث",
      "Add": "إضافة",
      "Edit": "تعديل",
      "Delete": "حذف",
      "Save": "حفظ",
      "Cancel": "إلغاء",
      "Active": "نشط",
      "Inactive": "غير نشط",
      "Revenue": "الإيراد",
      "Loading": "جاري التحميل",
      "No data available": "لا توجد بيانات متاحة",
    }
  },
  bn: {
    translation: {
      // Navigation
      "Dashboard": "ড্যাশবোর্ড",
      "Workers": "কর্মী",
      "Clients": "ক্লায়েন্ট",
      "Contracts": "চুক্তি",
      "Payroll": "বেতন",
      "Expenses": "খরচ",
      "Accounting": "হিসাবরক্ষণ",
      "Reports": "রিপোর্ট",
      "Settings": "সেটিংস",

      // Auth
      "Login": "লগইন",
      "Logout": "লগআউট",
      "Username": "ব্যবহারকারীর নাম",
      "Password": "পাসওয়ার্ড",
      "Welcome back": "আবার স্বাগতম",
      "Golden Noura ERP": "গোল্ডেন নূরা ইআরপি",
      "Invalid username or password": "ব্যবহারকারীর নাম বা পাসওয়ার্ড ভুল",
      "Connection error. Use admin / admin123 to login.": "সংযোগ ত্রুটি। admin / admin123 দিয়ে লগইন করুন",

      // Dashboard
      "Total Workers": "মোট কর্মী",
      "Active Workers": "সক্রিয় কর্মী",
      "Monthly Revenue": "মাসিক আয়",
      "Net Profit": "নিট লাভ",
      "Financial Overview": "আর্থিক ওভারভিউ",
      "System Settings": "সিস্টেম সেটিংস",

      // Workers page
      "Add Worker": "কর্মী যোগ করুন",
      "Search workers...": "কর্মী খুঁজুন...",
      "Name": "নাম",
      "Nationality": "জাতীয়তা",
      "Profession": "পেশা",
      "Status": "অবস্থা",
      "Action": "কার্যক্রম",
      "No workers database rows yet. Backend fully connected!": "এখনো কোনো কর্মী নেই। ব্যাকএন্ড সংযুক্ত!",

      // Clients page
      "Add Client": "ক্লায়েন্ট যোগ করুন",
      "Search clients...": "ক্লায়েন্ট খুঁজুন...",
      "Company Name": "কোম্পানির নাম",
      "Contact Person": "যোগাযোগের ব্যক্তি",
      "Phone": "ফোন",
      "No clients added yet.": "এখনো কোনো ক্লায়েন্ট নেই।",

      // Contracts page
      "New Contract": "নতুন চুক্তি",
      "Search contracts...": "চুক্তি খুঁজুন...",
      "Contract #": "চুক্তি নং",
      "Client": "ক্লায়েন্ট",
      "Worker": "কর্মী",
      "Rental Price": "ভাড়ার মূল্য",
      "No active contracts yet.": "এখনো কোনো সক্রিয় চুক্তি নেই।",

      // Expenses page
      "Add Expense": "খরচ যোগ করুন",
      "Monthly Expenses": "মাসিক খরচ",
      "Category": "বিভাগ",
      "Amount": "পরিমাণ",
      "Description": "বিবরণ",
      "General": "সাধারণ",
      "Salaries": "বেতন",
      "Rent": "ভাড়া",
      "Maintenance": "রক্ষণাবেক্ষণ",
      "Government Fees": "সরকারি ফি",
      "Utilities": "ইউটিলিটি",
      "Other": "অন্যান্য",
      "Enter details...": "বিস্তারিত লিখুন...",

      // Payroll page
      "Process Payroll": "বেতন প্রক্রিয়া",
      "Period": "সময়কাল",
      "Net Salary": "নিট বেতন",
      "Paid": "পরিশোধিত",
      "Processing": "প্রক্রিয়াধীন",
      "View Details": "বিস্তারিত দেখুন",
      "Select Worker": "কর্মী নির্বাচন করুন",
      "Month": "মাস",
      "Year": "বছর",
      "Bonuses": "বোনাস",
      "Deductions": "কর্তন",

      // Reports page
      "Reports Overview": "রিপোর্ট ওভারভিউ",
      "Export to Excel": "এক্সেল এ এক্সপোর্ট করুন",
      "Revenue vs Expenses": "আয় বনাম ব্যয়",

      // Common
      "Search": "খুঁজুন",
      "Add": "যোগ করুন",
      "Edit": "সম্পাদনা",
      "Delete": "মুছুন",
      "Save": "সংরক্ষণ",
      "Cancel": "বাতিল",
      "Active": "সক্রিয়",
      "Inactive": "নিষ্ক্রিয়",
      "Revenue": "আয়",
      "Loading": "লোড হচ্ছে",
      "No data available": "কোনো তথ্য উপলব্ধ নেই",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ar",
    fallbackLng: "ar",
    interpolation: { escapeValue: false }
  });

export default i18n;