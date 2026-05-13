import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

    // Ensure status field exists, default to 'lead' if not
    return (data || []).map(client => ({
      ...client,
      status: client.status || 'lead'
    }));
  } catch (error) {
    console.error('Error in getClients:', error);
    return [];
  }
}

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">👥</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Müşteriler
            </h1>
          </div>
          <p className="text-slate-600 text-lg">Tüm müşterilerinizi yönetin ve takip edin</p>
        </div>
        <Link
          href="/clients/new"
          className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">+</span>
          <span className="font-medium">Yeni Müşteri</span>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">🔍</span>
            </div>
            <span className="text-sm font-semibold text-slate-700">Filtrele:</span>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md">
            Tümü ({clients.length})
          </button>
          <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all duration-200 border border-blue-200/50">
            🔵 Lead ({clients.filter((c: any) => c.status === 'lead').length})
          </button>
          <button className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 transition-all duration-200 border border-amber-200/50">
            🟡 Prospect ({clients.filter((c: any) => c.status === 'prospect').length})
          </button>
          <button className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-all duration-200 border border-emerald-200/50">
            🟢 Active ({clients.filter((c: any) => c.status === 'active').length})
          </button>
          <button className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition-all duration-200 border border-slate-200/50">
            ⚪ Inactive ({clients.filter((c: any) => c.status === 'inactive').length})
          </button>
          <button className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-all duration-200 border border-purple-200/50">
            ✅ Completed ({clients.filter((c: any) => c.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Clients List or Empty State */}
      {clients.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-16 text-center border border-white/20">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">👥</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
            Henüz müşteri yok
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
            İlk müşterinizi ekleyerek AI destekli danışmanlık yolculuğunuza başlayın
          </p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            <span className="text-xl">+</span>
            <span>İlk Müşteriyi Ekle</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Sektör
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Şehir
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Instagram
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Kapasite
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Konumlandırma
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-slate-200/50">
              {clients.map((client: any) => {
                const statusConfig = {
                  lead: { emoji: '🔵', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
                  prospect: { emoji: '🟡', label: 'Prospect', color: 'bg-yellow-100 text-yellow-800' },
                  active: { emoji: '🟢', label: 'Active', color: 'bg-green-100 text-green-800' },
                  inactive: { emoji: '⚪', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
                  completed: { emoji: '✅', label: 'Completed', color: 'bg-purple-100 text-purple-800' },
                };
                const status = statusConfig[client.status as keyof typeof statusConfig] || statusConfig.lead;
                
                return (
                <tr key={client.id} className="hover:bg-white/80 transition-all duration-200 group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${status.color} border border-opacity-20`}>
                      {status.emoji} {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <Link 
                      href={`/clients/${client.id}`} 
                      className="font-semibold text-slate-800 hover:text-blue-600 transition-colors duration-200 group-hover:scale-105 transform inline-block"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl border border-blue-200/50">
                      {client.sector}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 font-medium">
                    {client.city || '-'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 font-medium">
                    {client.ig_handle ? (
                      <span className="text-pink-600 font-semibold">@{client.ig_handle}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 font-medium">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                      {client.weekly_content_capacity} video/hafta
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${
                      client.positioning === 'luxury' ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200/50' :
                      client.positioning === 'economic' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/50' :
                      'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border border-slate-200/50'
                    }`}>
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
