import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const normalizedBase = rawBase.endsWith('/api/v1')
  ? rawBase
  : `${rawBase.replace(/\/$/, '')}/api/v1`;

// Helper function to get full API URL for static assets
export const getApiBaseUrl = () => {
  return rawBase.replace(/\/api\/v1$/, '');
};

const api = axios.create({
  baseURL: normalizedBase,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 15000), // زودت المهلة لـ 15 ثانية
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // تحسين معالجة الأخطاء
    if (error.code === 'ECONNABORTED') {
      error.message = 'انتهت مهلة الاتصال. يرجى التحقق من اتصال الخادم.';
    } else if (error.response?.status === 401) {
      // لا تقم بإخراج المستخدم تلقائياً عند 401
      // أعِد الخطأ ليتم التعامل معه في الصفحة
      error.message = error.response.data?.detail || 'غير مصرح به';
    } else if (error.response?.status >= 500) {
      error.message = 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.';
    } else if (!error.response) {
      error.message = 'لا يمكن الاتصال بالخادم. يرجى التحقق من تشغيل الخادم.';
    }
    return Promise.reject(error);
  }
);

export default api;
