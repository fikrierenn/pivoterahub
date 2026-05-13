import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Plus } from 'lucide-react';

async function getClients() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    return (data || []).map(client => ({
      ...client,
      status: client.status || 'lead',
    }));
  } catch {
    return [];
  }
}

const STATUS_CONFIG = {
  lead: { label: 'Lead', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  prospect: { label: 'Prospect', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  active: { label: 'Active', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactive', dot: 'bg-zinc-400', badge: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  completed: { label: 'Completed', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Müşteriler</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Tüm müşterilerinizi yönetin</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Müşteri
        </Link>
      </div>

      {/* Status Filter */}
      <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button className="px-3 py-1.5 bg-zinc-900 text-white rounded-md text-xs font-medium">
            Tümü ({clients.length})
          </button>
          {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(key => (
            <button
              key={key}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:opacity-80 ${STATUS_CONFIG[key].badge}`}
            >
              {STATUS_CONFIG[key].label} ({clients.filter((c: any) => c.status === key).length})
            </button>
          ))}
        </div>
      </div>

      {/* Table or Empty */}
      {clients.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-16 text-center">
          <p className="text-zinc-500 text-sm mb-4">Henüz müşteri yok</p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            İlk Müşteriyi Ekle
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Durum', 'Müşteri', 'Sektör', 'Şehir', 'Instagram', 'Kapasite', 'Konumlandırma'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clients.map((client: any) => {
                const statusKey = (client.status in STATUS_CONFIG ? client.status : 'lead') as StatusKey;
                const status = STATUS_CONFIG[statusKey];

                return (
                  <tr key={client.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${status.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-blue-600 transition-colors"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded">
                        {client.sector}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-600">
                      {client.city || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {client.ig_handle ? (
                        <span className="text-pink-600">@{client.ig_handle}</span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-600">
                      {client.weekly_content_capacity} vid/hafta
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded capitalize">
                        {client.positioning || 'mid'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
