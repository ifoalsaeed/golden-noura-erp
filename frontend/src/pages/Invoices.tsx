import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search, Calendar, DollarSign, User, CheckCircle, AlertCircle, Printer, Trash2 } from 'lucide-react';
import DataEntryModal from '../components/common/DataEntryModal';
import api from '../api';
import { printWithLang } from '../utils/printLang';
import { requestApproval } from '../utils/approval';
import { getUserRole, Role } from '../utils/auth';

interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  contract_id?: number;
  issue_date: string;
  due_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  notes?: string;
  client?: {
    company_name: string;
  };
}

interface Client {
  id: number;
  company_name: string;
}

export default function Invoices() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
    amount: '',
    notes: ''
  });

  const fetchInvoices = async () => {
    try {
      const resp = await api.get('/invoices/');
      setInvoices(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const fetchClients = async () => {
    try {
      const resp = await api.get('/clients/');
      setClients(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, []);

  const handleSubmit = async () => {
    if (!formData.client_id || !formData.amount) return;
    setLoading(true);
    
    const amount = parseFloat(formData.amount);
    const tax_amount = amount * 0.15; // 15% VAT
    const total_amount = amount + tax_amount;

    try {
      const payload = {
        ...formData,
        client_id: parseInt(formData.client_id),
        amount,
        tax_amount,
        total_amount
      };

      await api.post('/invoices/', payload);
      await fetchInvoices();
      setIsModalOpen(false);
      setFormData({
        client_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: '',
        notes: ''
      });
    } catch (err) {
      console.error(err);
      alert(t('invoices.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm(t('invoices.confirmPaid'))) return;
    
    try {
      await api.post(`/invoices/${id}/pay`);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert(t('invoices.updateError'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-400';
      case 'OVERDUE': return 'text-red-400';
      case 'ISSUED': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gn-black p-4 rounded-lg shadow-md border border-gn-surface flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
            }}/>
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gn-gold">شركة جولدن نورة</h1>
                <span className="text-sm text-gn-goldLight uppercase tracking-widest">{t('invoices.title')}</span>
            </div>
          </div>
          <div className="text-right text-gray-400 text-sm">
            <p>{new Date().toLocaleDateString('ar-SA')}</p>
          </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t('invoices.title')}</h2>
        <div className="flex gap-2">
            <button
              onClick={() => printWithLang('en')}
              className="bg-gn-surface hover:bg-gn-surface/80 text-white font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg border border-gn-gold/20"
              title={t('common.print')}
            >
              <Printer className="w-5 h-5 mr-2 ml-2" /> {t('common.print')}
            </button>
            <button 
            onClick={() => {
                if (confirm(t('invoices.confirmGenerateBulk'))) {
                    api.post('/invoices/generate-bulk').then(() => fetchInvoices());
                }
            }}
            className="bg-gn-surface hover:bg-gn-surface/80 text-white font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg border border-gn-gold/20"
            >
            <FileText className="w-5 h-5 mr-2 ml-2" /> {t('invoices.generateMonthly')}
            </button>
            <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg"
            >
            <Plus className="w-5 h-5 mr-2 ml-2" /> {t('invoices.newInvoice')}
            </button>
        </div>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64 text-gray-400">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('invoices.search')} 
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gn-gold" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto text-gray-300">
          <table className="w-full text-left">
            <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface text-center">
              <tr>
                <th className="px-6 py-4">{t('invoices.invoiceNumber')}</th>
                <th className="px-6 py-4">{t('invoices.client')}</th>
                <th className="px-6 py-4">{t('invoices.issueDate')}</th>
                <th className="px-6 py-4">{t('invoices.dueDate')}</th>
                <th className="px-6 py-4">{t('invoices.amount')}</th>
                <th className="px-6 py-4">{t('invoices.status')}</th>
                <th className="px-6 py-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-surface text-center">
              {fetching ? (
                <tr><td colSpan={7} className="px-6 py-8">{t('common.loading')}...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-gray-500">{t('invoices.noInvoices')}</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gn-blackLight/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{inv.invoice_number}</td>
                    <td className="px-6 py-4">{inv.client?.company_name || `Client #${inv.client_id}`}</td>
                    <td className="px-6 py-4">{inv.issue_date}</td>
                    <td className="px-6 py-4">{inv.due_date}</td>
                    <td className="px-6 py-4 font-bold text-white">
                        {inv.total_amount.toLocaleString()} SAR
                    </td>
                    <td className={`px-6 py-4 font-semibold ${getStatusColor(inv.status)}`}>
                        {t(inv.status)}
                    </td>
                    <td className="px-6 py-4">
                      {inv.status !== 'PAID' && (
                          <button 
                            onClick={() => handleMarkPaid(inv.id)}
                            className="text-green-500 hover:text-green-400 transition flex items-center justify-center mx-auto"
                            title={t('invoices.markPaid')}
                          >
                              <CheckCircle className="w-5 h-5" />
                          </button>
                      )}
                    {getUserRole() === Role.ADMIN && (
                    <button
                      onClick={() => {
                        if (confirm(t('invoices.confirmDelete'))) {
                          requestApproval({ target_table: 'invoices', target_id: inv.id, action: 'DELETE' })
                            .then(() => alert(t('approvals.requestSent')))
                            .catch(() => alert(t('invoices.sendApprovalError')));
                        }
                      }}
                      className="text-red-400 hover:text-red-300 transition flex items-center justify-center mx-auto mt-2"
                      title={t('workers.requestEdit')}
                    >
                      <Trash2 className="w-5 h-5" />
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
        title={t('invoices.newInvoice')}
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <User className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('invoices.client')}
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({...formData, client_id: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none"
            >
                <option value="">{t('common.select')} {t('invoices.client')}</option>
                {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('invoices.issueDate')}
              </label>
              <input 
                type="date" 
                value={formData.issue_date}
                onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('invoices.dueDate')}
              </label>
              <input 
                type="date" 
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('invoices.amount')}
            </label>
            <input 
              type="number" 
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
                * {t('invoices.vatNote')} {(parseFloat(formData.amount || '0') * 1.15).toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <FileText className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('invoices.notes')}
            </label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none h-24" 
            />
          </div>
        </div>
      </DataEntryModal>
    </div>
  );
}
