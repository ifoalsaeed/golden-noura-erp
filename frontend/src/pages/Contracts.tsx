import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search, Calendar, User, Building2, DollarSign } from 'lucide-react';
import DataEntryModal from '../components/common/DataEntryModal';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Contract {
  id: number;
  contract_number: string;
  monthly_rental_price: number;
  status: string;
  client?: { company_name: string };
  worker?: { name: string };
}

interface Selection {
  id: number;
  name?: string;
  company_name?: string;
}

export default function Contracts() {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [workers, setWorkers] = useState<Selection[]>([]);
  const [clients, setClients] = useState<Selection[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    contract_number: `CON-${Date.now().toString().slice(-6)}`,
    client_id: '',
    worker_id: '',
    monthly_rental_price: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    duration_months: '12',
    billing_cycle: 'Monthly'
  });

  const fetchData = async () => {
    try {
      const [conResp, workResp, cliResp] = await Promise.all([
        fetch(`${API_URL}/api/v1/contracts/`),
        fetch(`${API_URL}/api/v1/workers/`),
        fetch(`${API_URL}/api/v1/clients/`)
      ]);
      if (conResp.ok) setContracts(await conResp.json());
      if (workResp.ok) setWorkers(await workResp.json());
      if (cliResp.ok) setClients(await cliResp.json());
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.client_id || !formData.worker_id) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/v1/contracts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          client_id: parseInt(formData.client_id),
          worker_id: parseInt(formData.worker_id),
          monthly_rental_price: parseFloat(formData.monthly_rental_price),
          duration_months: parseInt(formData.duration_months)
        })
      });
      if (resp.ok) {
        await fetchData();
        setIsModalOpen(false);
        setFormData({
            contract_number: `CON-${Date.now().toString().slice(-6)}`,
            client_id: '',
            worker_id: '',
            monthly_rental_price: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            duration_months: '12',
            billing_cycle: 'Monthly'
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
        <h2 className="text-2xl font-bold text-white">{t('Contracts')}</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2 ml-2" /> {t('New Contract')}
        </button>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64 text-gray-400">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('Search contracts...')} 
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gn-gold" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto text-gray-300">
          <table className="w-full text-left">
            <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface text-center">
              <tr>
                <th className="px-6 py-4">{t('Contract #')}</th>
                <th className="px-6 py-4">{t('Client')}</th>
                <th className="px-6 py-4">{t('Worker')}</th>
                <th className="px-6 py-4">{t('Rental Price')}</th>
                <th className="px-6 py-4">{t('Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-surface text-center">
              {fetching ? (
                <tr><td colSpan={5} className="px-6 py-8">{t('Loading')}...</td></tr>
              ) : contracts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-gray-500">{t('No active contracts yet.')}</td></tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gn-blackLight/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{contract.contract_number}</td>
                    <td className="px-6 py-4">{contract.client?.company_name || 'N/A'}</td>
                    <td className="px-6 py-4">{contract.worker?.name || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium text-gn-gold">SAR {contract.monthly_rental_price?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                        {t(contract.status)}
                      </span>
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
        title="New Contract"
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <FileText className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Contract #')}
              </label>
              <input 
                type="text" 
                value={formData.contract_number}
                onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Start Date')}
              </label>
              <input 
                type="date" 
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Building2 className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Client')}
              </label>
              <select 
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none"
              >
                <option value="">{t('Select Client')}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <User className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Worker')}
              </label>
              <select 
                value={formData.worker_id}
                onChange={(e) => setFormData({...formData, worker_id: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none"
              >
                <option value="">{t('Select Worker')}</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Rental Price')}
            </label>
            <input 
              type="number" 
              value={formData.monthly_rental_price}
              onChange={(e) => setFormData({...formData, monthly_rental_price: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none text-xl font-bold font-mono" 
              placeholder="0.00"
            />
          </div>
        </div>
      </DataEntryModal>
    </div>
  );
}
