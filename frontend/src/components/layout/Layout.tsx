import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function Layout() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <div className={`flex flex-row h-screen bg-gn-black text-gray-200 w-full`}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gn-blackLight p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}