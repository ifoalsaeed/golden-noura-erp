import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Plus, Search, Globe, Briefcase, FileText, Camera, Edit3 } from 'lucide-react';
import DataEntryModal from '../components/common/DataEntryModal';
import { getUserRole, Role } from '../utils/auth';
import api from '../api';
import { requestApproval } from '../utils/approval';

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
  const [editReqOpen, setEditReqOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [editReqForm, setEditReqForm] = useState({
    name: '',
    profession: '',
    salary: ''
  });

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
      const resp = await api.get('/workers/');
      setWorkers(resp.data);
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
      await api.post('/workers/', {
        ...formData,
        salary: parseFloat(formData.salary)
      });
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t('workers.title')}</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2 ml-2" /> {t('workers.addWorker')}
        </button>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64 text-gray-400">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('workers.searchPlaceholder')} 
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gn-gold" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto text-gray-300">
          <table className="w-full text-left">
            <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface text-center">
              <tr>
                <th className="px-6 py-4">{t('workers.name')}</th>
                <th className="px-6 py-4">{t('workers.nationality')}</th>
                <th className="px-6 py-4">{t('workers.profession')}</th>
                <th className="px-6 py-4">{t('workers.status')}</th>
                <th className="px-6 py-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-surface text-center">
              {fetching ? (
                <tr><td colSpan={5} className="px-6 py-8">{t('common.loading')}...</td></tr>
              ) : workers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-gray-500">{t('workers.noData')}</td></tr>
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
                      {getUserRole() === Role.ADMIN && (
                      <button
                        onClick={() => {
                          setCurrentWorker(worker);
                          setEditReqForm({
                            name: worker.name,
                            profession: worker.profession,
                            salary: '0'
                          });
                          setEditReqOpen(true);
                        }}
                        className="text-gn-gold hover:text-gn-goldLight transition flex items-center gap-1 justify-center mx-auto"
                        title={t('workers.requestEdit')}
                      >
                        <Edit3 className="w-4 h-4" /> {t('workers.requestEdit')}
                      </button>
                      )}
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
        title={t('workers.addWorker')}
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <User className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('workers.name')}
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              placeholder={t('workers.namePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Globe className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('workers.nationality')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <FileText className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('workers.passport')}
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
                <FileText className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('workers.iqama')}
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

      {/* Approval Request Modal */}
      <DataEntryModal
        isOpen={editReqOpen}
        onClose={() => setEditReqOpen(false)}
        title={t('workers.requestEdit')}
        onSubmit={async () => {
          if (!currentWorker) return;
          const payload: any = {};
          if (editReqForm.name && editReqForm.name !== currentWorker.name) payload.name = editReqForm.name;
          if (editReqForm.profession && editReqForm.profession !== currentWorker.profession) payload.profession = editReqForm.profession;
          if (editReqForm.salary && parseFloat(editReqForm.salary) > 0) payload.salary = parseFloat(editReqForm.salary);
          await requestApproval({
            target_table: 'workers',
            target_id: currentWorker.id,
            action: 'UPDATE',
            payload
          });
          alert(t('approvals.requestSent'));
          setEditReqOpen(false);
        }}
        loading={false}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <User className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('workers.name')}
            </label>
            <input
              type="text"
              value={editReqForm.name}
              onChange={(e) => setEditReqForm({ ...editReqForm, name: e.target.value })}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Briefcase className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Profession')}
              </label>
              <input
                type="text"
                value={editReqForm.profession}
                onChange={(e) => setEditReqForm({ ...editReqForm, profession: e.target.value })}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <FileText className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('workers.salary')}
              </label>
              <input
                type="number"
                value={editReqForm.salary}
                onChange={(e) => setEditReqForm({ ...editReqForm, salary: e.target.value })}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </DataEntryModal>
    </div>
  );
}
