import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, Search, Calendar, FileText, DollarSign, Trash2, Edit } from 'lucide-react';
import DataEntryModal from '../components/common/DataEntryModal';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function Expenses() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    category: 'General',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/v1/expenses/`);
      if (resp.ok) {
        const data = await resp.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('Are you sure?'))) return;
    try {
      const resp = await fetch(`${API_URL}/api/v1/expenses/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        setExpenses(expenses.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setFormData({
      category: exp.category,
      amount: exp.amount.toString(),
      description: exp.description,
      date: exp.date
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) return;
    setLoading(true);
    try {
      const url = editingId ? `${API_URL}/api/v1/expenses/${editingId}` : `${API_URL}/api/v1/expenses/`;
      const method = editingId ? 'PUT' : 'POST';
      
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      if (resp.ok) {
        await fetchExpenses();
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
          category: 'General',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
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
        <h2 className="text-2xl font-bold text-white">{t('Expenses')}</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-[0_0_15px_rgba(212,175,55,0.2)]"
        >
          <Plus className="w-5 h-5 mr-2 ml-2" /> {t('Add Expense')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm">{t('Monthly Expenses')}</p>
          <p className="text-2xl font-bold text-white mt-1">
            SAR {expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder={t('Search')} className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gn-gold" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface">
              <tr>
                <th className="px-6 py-4">{t('Date')}</th>
                <th className="px-6 py-4">{t('Category')}</th>
                <th className="px-6 py-4">{t('Description')}</th>
                <th className="px-6 py-4">{t('Amount')}</th>
                <th className="px-6 py-4 text-center">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-surface">
              {fetching ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">{t('Loading')}...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('No data available')}</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gn-blackLight/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{exp.date}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gn-gold/10 text-gn-gold text-xs rounded-full border border-gn-gold/20">
                        {t(exp.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{exp.description}</td>
                    <td className="px-6 py-4 font-bold text-white">SAR {exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <button onClick={() => handleEdit(exp)} className="p-2 text-gn-gold hover:bg-gn-gold/10 rounded-lg transition" title={t('Edit')}>
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition" title={t('Delete')}>
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

      {/* Add Expense Modal */}
      <DataEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add Expense"
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Date')}
              </label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Wallet className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Category')}
              </label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none"
              >
                <option value="General">{t('General')}</option>
                <option value="Salaries">{t('Salaries')}</option>
                <option value="Rent">{t('Rent')}</option>
                <option value="Maintenance">{t('Maintenance')}</option>
                <option value="Government Fees">{t('Government Fees')}</option>
                <option value="Utilities">{t('Utilities')}</option>
                <option value="Other">{t('Other')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Amount')}
            </label>
            <input 
              type="number" 
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none text-xl font-bold" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <FileText className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Description')}
            </label>
            <textarea 
              rows={3}
              placeholder={t('Enter details...')}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg px-4 py-3 text-white focus:border-gn-gold outline-none resize-none"
            />
          </div>
        </div>
      </DataEntryModal>
    </div>
  );
}
