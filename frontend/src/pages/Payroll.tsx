import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, User, Calendar, Plus, RefreshCw, CheckCircle, Clock, Trash2, Edit } from 'lucide-react';
import DataEntryModal from '../components/common/DataEntryModal';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Worker {
  id: number;
  name: string;
  salary: number;
  profession: string;
}

interface PayrollRecord {
  id: number;
  worker_id: number;
  month: number;
  year: number;
  net_salary: number;
  is_paid: boolean;
  worker?: Worker;
}

export default function Payroll() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    worker_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonuses: '0',
    deductions: '0',
    overtime: '0'
  });

  const fetchData = async () => {
    try {
      const [pResp, wResp] = await Promise.all([
        fetch(`${API_URL}/api/v1/payroll/`),
        fetch(`${API_URL}/api/v1/workers/`)
      ]);
      if (pResp.ok) {
        const pData = await pResp.json();
        setRecords(pData);
      }
      if (wResp.ok) setWorkers(await wResp.json());
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('Are you sure?'))) return;
    try {
      const resp = await fetch(`${API_URL}/api/v1/payroll/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        setRecords(records.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (rec: PayrollRecord) => {
    setEditingId(rec.id);
    setFormData({
      worker_id: rec.worker_id.toString(),
      month: rec.month,
      year: rec.year,
      bonuses: '0', // We can't easily fetch old sub-components unless backend stores them,
      deductions: '0', // but the schema has them. We'll set 0 and let user override
      overtime: '0'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.worker_id) return;
    setLoading(true);
    try {
      const url = editingId ? `${API_URL}/api/v1/payroll/${editingId}` : `${API_URL}/api/v1/payroll/calculate`;
      const method = editingId ? 'PUT' : 'POST';
      
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: parseInt(formData.worker_id),
          month: formData.month,
          year: formData.year,
          bonuses: parseFloat(formData.bonuses),
          deductions: parseFloat(formData.deductions),
          overtime: parseFloat(formData.overtime)
        })
      });
      if (resp.ok) {
        await fetchData();
        setIsModalOpen(false);
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      const resp = await fetch(`${API_URL}/api/v1/payroll/${id}/pay`, {
        method: 'PATCH'
      });
      if (resp.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getWorkerName = (id: number) => {
    return workers.find(w => w.id === id)?.name || '...';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t('Payroll')}</h2>
        <div className="flex gap-4">
          <button 
            onClick={fetchData}
            className="p-2 bg-gn-surface border border-gn-surface rounded-lg text-gray-400 hover:text-gn-gold transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2 ml-2" /> {t('Process Payroll')}
          </button>
        </div>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface">
              <tr>
                <th className="px-6 py-4">{t('Worker')}</th>
                <th className="px-6 py-4">{t('Period')}</th>
                <th className="px-6 py-4">{t('Net Salary')}</th>
                <th className="px-6 py-4">{t('Status')}</th>
                <th className="px-6 py-4">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-surface">
              {fetching ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">{t('Loading')}...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('No data available')}</td></tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gn-blackLight/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gn-gold/10 flex items-center justify-center mr-3 ml-3 text-gn-gold font-bold">
                          {getWorkerName(rec.worker_id).charAt(0)}
                        </div>
                        <span className="font-medium text-white">{getWorkerName(rec.worker_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{rec.month}/{rec.year}</td>
                    <td className="px-6 py-4 font-bold text-green-400">SAR {rec.net_salary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      {rec.is_paid ? (
                        <span className="flex items-center text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1 ml-1" /> {t('Paid')}
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-500">
                          <Clock className="w-4 h-4 mr-1 ml-1" /> {t('Processing')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-4 items-center">
                      {!rec.is_paid && (
                        <>
                          <button 
                            onClick={() => handleMarkAsPaid(rec.id)}
                            className="px-3 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-bold rounded-lg transition border border-green-500/20"
                          >
                            {t('Mark as Paid')}
                          </button>
                          <button 
                            onClick={() => handleEdit(rec)}
                            className="p-2 text-gn-gold hover:bg-gn-gold/10 rounded-lg transition" 
                            title={t('Edit')}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(rec.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition" 
                        title={t('Delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
        title="Process Payroll"
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <User className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Worker')}
            </label>
            <select 
              value={formData.worker_id}
              onChange={(e) => setFormData({...formData, worker_id: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
              required
            >
              <option value="">{t('Select Worker')}</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.profession})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Month')}
              </label>
              <input 
                type="number" min="1" max="12"
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Year')}
              </label>
              <input 
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Plus className="w-4 h-4 mr-2 ml-2 text-green-400" /> {t('Bonuses')}
              </label>
              <input 
                type="number"
                value={formData.bonuses}
                onChange={(e) => setFormData({...formData, bonuses: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Plus className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Overtime')}
              </label>
              <input 
                type="number"
                value={formData.overtime}
                onChange={(e) => setFormData({...formData, overtime: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Plus className="w-4 h-4 mr-2 ml-2 text-red-400" /> {t('Deductions')}
              </label>
              <input 
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
          </div>
        </div>
      </DataEntryModal>
    </div>
  );
}
