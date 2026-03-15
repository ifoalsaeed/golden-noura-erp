import { useEffect, useState } from 'react';
import api from '../api';
import { Check, X, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Approval {
  id: number;
  target_table: string;
  target_id: number;
  action: string;
  payload?: any;
  status: string;
  created_at: string;
}

export default function Approvals() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/approvals/pending');
      setItems(resp.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const act = async (id: number, approve: boolean) => {
    try {
      if (approve) await api.post(`/approvals/${id}/approve`, { note: 'OK' });
      else await api.post(`/approvals/${id}/reject`, { note: 'Rejected' });
      fetchPending();
    } catch (e) {
      console.error(e);
      alert(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-gn-gold" />
        <h2 className="text-2xl font-bold text-white">{t('approvals.title')}</h2>
      </div>
      <div className="bg-gn-surface/50 border border-gn-surface rounded-xl p-6">
        {loading ? <div className="text-gray-400">{t('common.loading')}...</div> : (
          <table className="w-full text-center text-gray-300">
            <thead className="text-xs uppercase text-gn-goldLight">
              <tr>
                <th className="py-3">ID</th>
                <th className="py-3">{t('approvals.table')}</th>
                <th className="py-3">{t('approvals.record')}</th>
                <th className="py-3">{t('approvals.action')}</th>
                <th className="py-3">{t('approvals.payload')}</th>
                <th className="py-3">{t('approvals.decision')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-surface">
              {items.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-gray-500">{t('common.noData')}</td></tr>
              ) : items.map(it => (
                <tr key={it.id}>
                  <td className="py-3">{it.id}</td>
                  <td className="py-3">{it.target_table}</td>
                  <td className="py-3">#{it.target_id}</td>
                  <td className="py-3">{it.action}</td>
                  <td className="py-3 text-left px-4">
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap">{it.payload ? JSON.stringify(it.payload, null, 2) : '-'}</pre>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => act(it.id, true)} className="text-green-400 hover:text-green-300"><Check className="w-5 h-5" /></button>
                      <button onClick={() => act(it.id, false)} className="text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

