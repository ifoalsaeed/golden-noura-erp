import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Plus, Search, Globe, Briefcase, FileText, Camera } from 'lucide-react';
import DataEntryModal from '../components/common/DataEntryModal';

const API_URL = import.meta.env.VITE_API_URL || '';

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
  const [fetching, setFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nationality: '',
    profession: '',
    passport_number: '',
    iqama_number: '',
    salary: '0',
    status: 'ACTIVE'
  });

  const fetchWorkers = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/v1/workers/`);
      if (resp.ok) {
        const data = await resp.json();
        setWorkers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/v1/workers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary)
        })
      });
      if (resp.ok) {
        await fetchWorkers();
        setIsModalOpen(false);
        setFormData({
          name: '',
          nationality: '',
          profession: '',
          passport_number: '',
          iqama_number: '',
          salary: '0',
          status: 'ACTIVE'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t('Workers')}</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2 ml-2" /> {t('Add Worker')}
        </button>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64 text-gray-400">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('Search workers...')} 
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gn-gold" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto text-gray-300">
          <table className="w-full text-left">
            <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface text-center">
              <tr>
                <th className="px-6 py-4">{t('Name')}</th>
                <th className="px-6 py-4">{t('Nationality')}</th>
                <th className="px-6 py-4">{t('Profession')}</th>
                <th className="px-6 py-4">{t('Status')}</th>
                <th className="px-6 py-4">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-surface text-center">
              {fetching ? (
                <tr><td colSpan={5} className="px-6 py-8">{t('Loading')}...</td></tr>
              ) : workers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-gray-500">{t('No workers database rows yet. Backend fully connected!')}</td></tr>
              ) : (
                workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gn-blackLight/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{worker.name}</td>
                    <td className="px-6 py-4">{worker.nationality}</td>
                    <td className="px-6 py-4">{worker.profession}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                        {t(worker.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gn-gold hover:text-gn-goldLight transition">{t('Edit')}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DataEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add Worker"
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <User className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Name')}
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Globe className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Nationality')}
              </label>
              <input 
                type="text" 
                value={formData.nationality}
                onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Briefcase className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Profession')}
              </label>
              <input 
                type="text" 
                value={formData.profession}
                onChange={(e) => setFormData({...formData, profession: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <FileText className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Passport #')}
              </label>
              <input 
                type="text" 
                value={formData.passport_number}
                onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <FileText className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Iqama #')}
              </label>
              <input 
                type="text" 
                value={formData.iqama_number}
                onChange={(e) => setFormData({...formData, iqama_number: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
          </div>
        </div>
      </DataEntryModal>
    </div>
  );
}
