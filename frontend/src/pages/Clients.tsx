import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import DataEntryModal from '../components/common/DataEntryModal';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Client {
  id: number;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
}

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    city: '',
    address: ''
  });

  const fetchClients = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/v1/clients/`);
      if (resp.ok) {
        const data = await resp.json();
        setClients(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async () => {
    if (!formData.company_name) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/v1/clients/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (resp.ok) {
        await fetchClients();
        setIsModalOpen(false);
        setFormData({
            company_name: '',
            contact_person: '',
            phone: '',
            email: '',
            city: '',
            address: ''
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
        <h2 className="text-2xl font-bold text-white">{t('Clients')}</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gn-gold hover:bg-gn-goldDark text-gn-black font-bold py-2 px-6 rounded-lg flex items-center transition shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2 ml-2" /> {t('Add Client')}
        </button>
      </div>

      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64 text-gray-400">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('Search clients...')} 
              className="w-full bg-gn-blackLight border border-gn-surface rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gn-gold" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto text-gray-300">
          <table className="w-full text-left">
            <thead className="text-xs text-gn-goldLight uppercase bg-gn-blackLight/50 border-b border-gn-surface text-center">
              <tr>
                <th className="px-6 py-4">{t('Company Name')}</th>
                <th className="px-6 py-4">{t('Contact Person')}</th>
                <th className="px-6 py-4">{t('Phone')}</th>
                <th className="px-6 py-4">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-surface text-center">
              {fetching ? (
                <tr><td colSpan={4} className="px-6 py-8">{t('Loading')}...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-gray-500">{t('No clients added yet.')}</td></tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gn-blackLight/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{client.company_name}</td>
                    <td className="px-6 py-4">{client.contact_person}</td>
                    <td className="px-6 py-4">{client.phone}</td>
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
        title="Add Client"
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <Building2 className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Company Name')}
            </label>
            <input 
              type="text" 
              value={formData.company_name}
              onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Plus className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Contact Person')}
              </label>
              <input 
                type="text" 
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center">
                <Phone className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Phone')}
              </label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <Mail className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Email')}
            </label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center">
              <MapPin className="w-4 h-4 mr-2 ml-2 text-gn-gold" /> {t('Address')}
            </label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full bg-gn-blackLight border border-gn-surface rounded-xl px-4 py-3 text-white focus:border-gn-gold outline-none" 
            />
          </div>
        </div>
      </DataEntryModal>
    </div>
  );
}
