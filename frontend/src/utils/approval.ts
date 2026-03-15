import api from '../api';

export async function requestApproval(params: {
  target_table: string;
  target_id: number;
  action: 'UPDATE'|'DELETE';
  payload?: any;
  reason?: string;
}) {
  const resp = await api.post('/approvals/', params);
  return resp.data;
}

