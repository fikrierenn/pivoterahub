'use client';

import { useState } from 'react';

interface BioAnalysisFormProps {
  clientId: string;
  onAnalysisComplete: (analysis: any) => void;
  initialData?: {
    bio_text?: string;
    followers_count?: number;
    following_count?: number;
    posts_count?: number;
    is_verified?: boolean;
    is_private?: boolean;
  };
}

export default function BioAnalysisForm({ 
  clientId, 
  onAnalysisComplete, 
  initialData 
}: BioAnalysisFormProps) {
  const [formData, setFormData] = useState({
    bio_text: initialData?.bio_text || '',
    followers_count: initialData?.followers_count || 0,
    following_count: initialData?.following_count || 0,
    posts_count: initialData?.posts_count || 0,
    is_verified: initialData?.is_verified || false,
    is_private: initialData?.is_private || false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bio_text.trim()) {
      newErrors.bio_text = 'Bio metni gereklidir';
    } else if (formData.bio_text.length > 500) {
      newErrors.bio_text = 'Bio metni çok uzun (max 500 karakter)';
    }

    if (formData.followers_count < 0) {
      newErrors.followers_count = 'Takipçi sayısı negatif olamaz';
    }

    if (formData.following_count < 0) {
      newErrors.following_count = 'Takip sayısı negatif olamaz';
    }

    if (formData.posts_count < 0) {
      newErrors.posts_count = 'Gönderi sayısı negatif olamaz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/bio-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analiz başarısız');
      }

      const result = await response.json();
      onAnalysisComplete(result);
      
    } catch (error: any) {
      console.error('Bio analysis error:', error);
      setErrors({ submit: error.message || 'Analiz sırasında hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">📱 Instagram Bio Analizi</h2>
        <div className="text-sm text-gray-500">
          {formData.bio_text.length}/500 karakter
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bio Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Instagram Bio Metni *
          </label>
          <textarea
            value={formData.bio_text}
            onChange={(e) => handleInputChange('bio_text', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.bio_text ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
            placeholder="Instagram bio metnini buraya yapıştırın..."
            maxLength={500}
          />
          {errors.bio_text && (
            <p className="text-red-500 text-sm mt-1">{errors.bio_text}</p>
          )}
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👥 Takipçi Sayısı
            </label>
            <input
              type="number"
              value={formData.followers_count}
              onChange={(e) => handleInputChange('followers_count', parseInt(e.target.value) || 0)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.followers_count ? 'border-red-500' : 'border-gray-300'
              }`}
              min="0"
              placeholder="0"
            />
            {errors.followers_count && (
              <p className="text-red-500 text-sm mt-1">{errors.followers_count}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ➕ Takip Sayısı
            </label>
            <input
              type="number"
              value={formData.following_count}
              onChange={(e) => handleInputChange('following_count', parseInt(e.target.value) || 0)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.following_count ? 'border-red-500' : 'border-gray-300'
              }`}
              min="0"
              placeholder="0"
            />
            {errors.following_count && (
              <p className="text-red-500 text-sm mt-1">{errors.following_count}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Gönderi Sayısı
            </label>
            <input
              type="number"
              value={formData.posts_count}
              onChange={(e) => handleInputChange('posts_count', parseInt(e.target.value) || 0)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.posts_count ? 'border-red-500' : 'border-gray-300'
              }`}
              min="0"
              placeholder="0"
            />
            {errors.posts_count && (
              <p className="text-red-500 text-sm mt-1">{errors.posts_count}</p>
            )}
          </div>
        </div>

        {/* Account Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_verified"
              checked={formData.is_verified}
              onChange={(e) => handleInputChange('is_verified', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_verified" className="ml-2 block text-sm text-gray-700">
              ✅ Doğrulanmış hesap
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_private"
              checked={formData.is_private}
              onChange={(e) => handleInputChange('is_private', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_private" className="ml-2 block text-sm text-gray-700">
              🔒 Gizli hesap
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !formData.bio_text.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analiz Ediliyor...
              </span>
            ) : (
              '🚀 Bio Analizi Başlat'
            )}
          </button>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  );
}