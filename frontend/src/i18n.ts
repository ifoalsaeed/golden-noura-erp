import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ar: {
    translation: {
      "Dashboard": "لوحة القيادة",
      "Workers": "العمال",
      "Clients": "العملاء",
      "Contracts": "العقود",
      "Payroll": "الرواتب",
      "Expenses": "المصروفات",
      "Accounting": "المحاسبة",
      "Reports": "التقارير",
      "Settings": "الإعدادات",
      "Total Workers": "إجمالي العمال",
      "Active Workers": "عمال نشطون",
      "Monthly Revenue": "الدخل الشهري",
      "Net Profit": "صافي الربح",
      "Login": "تسجيل الدخول",
      "Logout": "تسجيل الخروج",
      "Username": "اسم المستخدم",
      "Password": "كلمة المرور",
      "System Settings": "إعدادات النظام",
      "Golden Noura ERP": "نظام نور الذهبي",
      "Welcome back": "مرحباً بعودتك",
      "Financial Overview": "نظرة عامة مالية",
      "Invalid username or password": "اسم المستخدم أو كلمة المرور غير صحيحة",
      "Connection error. Use admin / admin123 to login.": "خطأ في الاتصال. استخدم admin / admin123 للدخول",

      "Add Worker": "إضافة عامل",
      "Search workers...": "بحث عن عمال...",
      "Name": "الاسم",
      "Nationality": "الجنسية",
      "Profession": "المهنة",
      "Status": "الحالة",
      "Action": "إجراء",
      "No workers database rows yet. Backend fully connected!": "لا يوجد عمال بعد. السيرفر متصل!",
      "Add Client": "إضافة عميل",
      "Search clients...": "بحث عن عملاء...",
      "Company Name": "اسم الشركة",
      "Contact Person": "الشخص المسؤول",
      "Phone": "الهاتف",
      "No clients added yet.": "لا يوجد عملاء بعد.",
      "New Contract": "عقد جديد",
      "Search contracts...": "بحث في العقود...",
      "Contract #": "رقم العقد",
      "Client": "العميل",
      "Worker": "العامل",
      "Rental Price": "سعر الإيجار",
      "No active contracts yet.": "لا توجد عقود نشطة بعد.",
    }
  },
  bn: {
    translation: {
      "Dashboard": "ড্যাশবোর্ড",
      "Workers": "কর্মী",
      "Clients": "ক্লায়েন্ট",
      "Contracts": "চুক্তি",
      "Payroll": "বেতন",
      "Expenses": "খরচ",
      "Accounting": "হিসাবরক্ষণ",
      "Reports": "রিপোর্ট",
      "Settings": "সেটিংস",
      "Total Workers": "মোট কর্মী",
      "Active Workers": "সক্রিয় কর্মী",
      "Monthly Revenue": "মাসিক আয়",
      "Net Profit": "নিট লাভ",
      "Login": "লগইন",
      "Logout": "লগআউট",
      "Username": "ব্যবহারকারীর নাম",
      "Password": "পাসওয়ার্ড",
      "System Settings": "সিস্টেম সেটিংস",
      "Golden Noura ERP": "গোল্ডেন নূরা ইআরপি",
      "Welcome back": "আবার স্বাগতম",
      "Financial Overview": "আর্থিক ওভারভিউ",
      "Invalid username or password": "ব্যবহারকারীর নাম বা পাসওয়ার্ড ভুল",
      "Connection error. Use admin / admin123 to login.": "সংযোগ ত্রুটি। admin / admin123 দিয়ে লগইন করুন",

      "Add Worker": "কর্মী যোগ করুন",
      "Search workers...": "কর্মী খুঁজুন...",
      "Name": "নাম",
      "Nationality": "জাতীয়তা",
      "Profession": "পেশা",
      "Status": "অবস্থা",
      "Action": "কার্যক্রম",
      "No workers database rows yet. Backend fully connected!": "এখনো কোনো কর্মী নেই। ব্যাকএন্ড সংযুক্ত!",
      "Add Client": "ক্লায়েন্ট যোগ করুন",
      "Search clients...": "ক্লায়েন্ট খুঁজুন...",
      "Company Name": "কোম্পানির নাম",
      "Contact Person": "যোগাযোগের ব্যক্তি",
      "Phone": "ফোন",
      "No clients added yet.": "এখনো কোনো ক্লায়েন্ট নেই।",
      "New Contract": "নতুন চুক্তি",
      "Search contracts...": "চুক্তি খুঁজুন...",
      "Contract #": "চুক্তি নং",
      "Client": "ক্লায়েন্ট",
      "Worker": "কর্মী",
      "Rental Price": "ভাড়ার মূল্য",
      "No active contracts yet.": "এখনো কোনো সক্রিয় চুক্তি নেই।",
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