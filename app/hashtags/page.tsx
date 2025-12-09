export default function HashtagsPage() {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hashtag Performansı</h1>
        <p className="text-gray-600 mt-1">En iyi ve en zayıf performans gösteren hashtag'ler</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Müşteri:</label>
          <select className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Tüm Müşteriler</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Filtrele
          </button>
        </div>
      </div>

      {/* Top Hashtags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🏆 En İyi Hashtag'ler</h2>
            <span className="text-sm text-green-600 font-medium">Yüksek Performans</span>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">#örnek</span>
                <span className="text-sm text-gray-600">Kullanım: 0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ort. İzlenme: 0</span>
                <span className="text-gray-600">Engagement: 0%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center text-gray-500 text-sm">
            Henüz veri yok
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">⚠️ Zayıf Hashtag'ler</h2>
            <span className="text-sm text-red-600 font-medium">Düşük Performans</span>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">#örnek</span>
                <span className="text-sm text-gray-600">Kullanım: 0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ort. İzlenme: 0</span>
                <span className="text-gray-600">Engagement: 0%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center text-gray-500 text-sm">
            Henüz veri yok
          </div>
        </div>
      </div>

      {/* All Hashtags Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Tüm Hashtag'ler</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hashtag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanım
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam İzlenme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ort. İzlenme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Kullanım
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Henüz hashtag verisi yok
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
