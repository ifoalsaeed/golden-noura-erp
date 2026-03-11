import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Loader2 } from 'lucide-react';
import api from '../api';
import { hasPermission } from '../utils/permissions';

interface Worker {
  id: number;
  name: string;
  nationality: string;
  profession: string;
  status: string;
}

export default function Workers() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const canEdit = hasPermission('workers', 'edit');
  const canDelete = hasPermission('workers', 'delete');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workers/');
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">{t('Workers')}</h2>
        {canEdit && (
          <button className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-extrabold py-2.5 px-6 rounded-xl flex items-center transition-all shadow-lg hover:shadow-gn-gold/20 transform hover:-translate-y-0.5 active:translate-y-0">
            <Plus className="w-5 h-5 mr-2" /> {t('Add Worker')}
          </button>
        )}
      </div>

      <div className="bg-gn-surface/40 backdrop-blur-sm border border-gn-surface/50 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-80 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gn-gold/50 w-5 h-5 transition-colors group-focus-within:text-gn-gold" />
            <input
              type="text"
              placeholder={t('Search workers...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gn-blackLight/50 border border-gn-surface rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-gn-gold/50 focus:ring-1 focus:ring-gn-gold/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-12 h-12 text-gn-gold animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead className="text-[10px] font-black text-gn-gold uppercase tracking-[0.2em] opacity-70">
                <tr>
                  <th className="px-6 py-4">{t('Name')}</th>
                  <th className="px-6 py-4">{t('Nationality')}</th>
                  <th className="px-6 py-4">{t('Profession')}</th>
                  <th className="px-6 py-4">{t('Status')}</th>
                  {(canEdit || canDelete) && <th className="px-6 py-4 text-center">{t('Action')}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="group bg-gn-blackLight/20 border border-transparent hover:border-gn-gold/20 hover:bg-gn-gold/5 transition-all duration-300">
                      <td className="px-6 py-5 text-white font-bold rounded-l-xl border-y border-gn-surface/30 group-hover:border-gn-gold/20">{worker.name}</td>
                      <td className="px-6 py-5 text-gray-400 font-medium border-y border-gn-surface/30 group-hover:border-gn-gold/20">{worker.nationality}</td>
                      <td className="px-6 py-5 text-gray-400 font-medium border-y border-gn-surface/30 group-hover:border-gn-gold/20">{worker.profession}</td>
                      <td className="px-6 py-5 border-y border-gn-surface/30 group-hover:border-gn-gold/20">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${worker.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                          {worker.status}
                        </span>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="px-6 py-5 rounded-r-xl border-y border-gn-surface/30 group-hover:border-gn-gold/20">
                          <div className="flex justify-center items-center gap-4">
                            {canEdit && <button className="text-gn-gold hover:text-white transition-colors text-xs font-black uppercase tracking-widest">{t('Edit')}</button>}
                            {canDelete && <button className="text-red-500/50 hover:text-red-400 transition-colors text-xs font-black uppercase tracking-widest">{t('Delete')}</button>}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-12 text-center text-gray-500 font-medium" colSpan={(canEdit || canDelete) ? 5 : 4}>
                      {searchTerm ? t('No workers found matching your search.') : t('No workers found in database.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
