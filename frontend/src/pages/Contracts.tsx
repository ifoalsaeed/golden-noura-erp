import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { hasPermission } from '../utils/permissions';

export default function Contracts() {
  const { t } = useTranslation();
  const canEdit = hasPermission('contracts', 'edit');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">{t('Contracts')}</h2>
        {canEdit && (
          <button className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-extrabold py-2.5 px-6 rounded-xl flex items-center transition-all shadow-lg hover:shadow-gn-gold/20 transform hover:-translate-y-0.5 active:translate-y-0">
            <Plus className="w-5 h-5 mr-2" /> {t('New Contract')}
          </button>
        )}
      </div>

      <div className="bg-gn-surface/40 backdrop-blur-sm border border-gn-surface/50 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-80 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gn-gold/50 w-5 h-5 transition-colors group-focus-within:text-gn-gold" />
            <input
              type="text"
              placeholder={t('Search contracts...')}
              className="w-full bg-gn-blackLight/50 border border-gn-surface rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-gn-gold/50 focus:ring-1 focus:ring-gn-gold/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead className="text-[10px] font-black text-gn-gold uppercase tracking-[0.2em] opacity-70">
              <tr>
                <th className="px-6 py-4">{t('Contract #')}</th>
                <th className="px-6 py-4">{t('Client')}</th>
                <th className="px-6 py-4">{t('Worker')}</th>
                <th className="px-6 py-4">{t('Rental Price')}</th>
                <th className="px-6 py-4">{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-12 text-center text-gray-500 font-medium" colSpan={5}>
                  {t('No active contracts yet.')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
