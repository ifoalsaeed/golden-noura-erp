import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  loading?: boolean;
}

export default function DataEntryModal({ isOpen, onClose, title, children, onSubmit, loading }: ModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gn-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-gn-surface/90 border border-gn-gold/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gn-gold to-gn-goldDark"></div>
        
        <div className="p-6 border-b border-gn-surface/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{t(title)}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>

        <div className="p-6 border-t border-gn-surface/50 flex justify-end space-x-4 gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-gray-400 hover:text-white transition font-medium"
          >
            {t('Cancel')}
          </button>
          <button 
            onClick={onSubmit}
            disabled={loading}
            className="px-8 py-2 bg-gradient-to-r from-gn-gold to-gn-goldDark hover:from-gn-goldLight hover:to-gn-gold text-gn-black font-bold rounded-lg shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50"
          >
            {loading ? '...' : t('Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
