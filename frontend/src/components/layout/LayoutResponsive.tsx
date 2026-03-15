import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function Layout() {
  const { i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    
    // Detect mobile screen
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [i18n.language]);

  return (
    <div className={`gn-layout flex h-screen bg-gn-black text-gray-200 w-full overflow-hidden`}>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="gn-sidebar-desktop hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="gn-main-content flex-1 overflow-x-hidden overflow-y-auto bg-gn-blackLight p-4 md:p-6">
          <Outlet />
        </main>
        
        {/* Mobile Navigation - Only visible on mobile */}
        {isMobile && <MobileNav />}
      </div>
    </div>
  );
}
