'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    city: '',
    ig_handle: '',
    weekly_content_capacity: 3,
    positioning: 'mid',
    status: 'lead',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/clients');
      } else {
        alert('Müşteri eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Yeni Müşteri Ekle</h1>
          <p className="text-gray-600 mt-1">Müşteri bilgilerini girin</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Adı *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Ahmet Yılmaz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sektör *
            </label>
            <input
              type="text"
              required
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Emlak, Gelinlik, Fitness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şehir
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: İstanbul"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram Handle
            </label>
            <input
              type="text"
              value={formData.ig_handle}
              onChange={(e) => setFormData({ ...formData, ig_handle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="@kullaniciadi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Haftalık İçerik Kapasitesi
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.weekly_content_capacity}
              onChange={(e) => setFormData({ ...formData, weekly_content_capacity: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konumlandırma
            </label>
            <select
              value={formData.positioning}
              onChange={(e) => setFormData({ ...formData, positioning: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="luxury">Luxury (Lüks)</option>
              <option value="mid">Mid (Orta Segment)</option>
              <option value="economic">Economic (Ekonomik)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Durumu
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lead">🔵 Lead - Potansiyel Müşteri</option>
              <option value="prospect">🟡 Prospect - Görüşülen Müşteri</option>
              <option value="active">🟢 Active - Aktif Çalışılan</option>
              <option value="inactive">⚪ Inactive - Pasif</option>
              <option value="completed">✅ Completed - Tamamlanmış</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Lead: İlk temas • Prospect: Görüşme yapıldı • Active: Anlaşma var
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Müşteri Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
