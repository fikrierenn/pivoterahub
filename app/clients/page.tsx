export default function ClientsPage() {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-gray-600 mt-1">Tüm müşterilerinizi yönetin</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + Yeni Müşteri
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz müşteri yok</h2>
        <p className="text-gray-600 mb-6">
          İlk müşterinizi ekleyerek başlayın
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          İlk Müşteriyi Ekle
        </button>
      </div>
    </div>
  );
}
