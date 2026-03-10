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
      "Total Workers": "إجمالي العمال",
      "Active Workers": "عمال نشطون",
      "Monthly Revenue": "الدخل الشهري",
      "Net Profit": "صافي الربح",
      "Login": "تسجيل الدخول",
      "Username": "اسم المستخدم",
      "Password": "كلمة المرور",
      "System Settings": "إعدادات النظام",
      "Logout": "تسجيل الخروج",
      "Golden Noura ERP": "نظام نور الذهبي",
      "Welcome back": "مرحباً بعودتك",
      "Financial Overview": "نظرة عامة مالية"
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
      "Total Workers": "মোট কর্মী",
      "Active Workers": "সক্রিয় কর্মী",
      "Monthly Revenue": "মাসিক আয়",
      "Net Profit": "নিট লাভ",
      "Login": "লগইন",
      "Username": "ব্যবহারকারীর নাম",
      "Password": "পাসওয়ার্ড",
      "System Settings": "সিস্টেম সেটিংস",
      "Logout": "লগআউট",
      "Golden Noura ERP": "গোল্ডেন নূরা ইআরপি",
      "Welcome back": "আবার স্বাগতম",
      "Financial Overview": "আর্থিক ওভারভিউ"
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