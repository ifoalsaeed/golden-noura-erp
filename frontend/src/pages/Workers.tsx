import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Loader2 } from 'lucide-react';
import api from '../api';

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
        <h2 className="text-2xl font-bold text-white">{t('Workers')}</h2>
        <button className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-4 rounded-lg flex items-center transition">
          <Plus className="w-5 h-5 mr-2" /> {t('Add Worker')}
        </button>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gn-gold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-gn-gold animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-gray-300">
              <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface">
                <tr>
                  <th className="px-6 py-4">{t('Name')}</th>
                  <th className="px-6 py-4">{t('Nationality')}</th>
                  <th className="px-6 py-4">{t('Profession')}</th>
                  <th className="px-6 py-4">{t('Status')}</th>
                  <th className="px-6 py-4">{t('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b border-gn-surface hover:bg-gn-blackLight/30">
                      <td className="px-6 py-4 text-white font-medium">{worker.name}</td>
                      <td className="px-6 py-4">{worker.nationality}</td>
                      <td className="px-6 py-4">{worker.profession}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${worker.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                          {worker.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-gn-gold hover:text-gn-goldLight transition pr-4">Edit</button>
                        <button className="text-red-400 hover:text-red-300 transition">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-gn-surface">
                    <td className="px-6 py-8 text-center" colSpan={5}>
                      {searchTerm ? 'No workers found matching your search.' : 'No workers found in database.'}
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
