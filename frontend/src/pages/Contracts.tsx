import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search } from 'lucide-react';

export default function Contracts() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t('Contracts')}</h2>
        <button className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-4 rounded-lg flex items-center transition">
          <Plus className="w-5 h-5 mr-2 ml-2" /> {t('New Contract')}
        </button>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder={t('Search contracts...')} className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gn-gold" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface">
              <tr>
                <th className="px-6 py-4">{t('Contract #')}</th>
                <th className="px-6 py-4">{t('Client')}</th>
                <th className="px-6 py-4">{t('Worker')}</th>
                <th className="px-6 py-4">{t('Rental Price')}</th>
                <th className="px-6 py-4">{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gn-surface hover:bg-gn-blackLight/30">
                <td className="px-6 py-4" colSpan={5} style={{textAlign: "center"}}>{t('No active contracts yet.')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
