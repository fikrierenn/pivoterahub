'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ClientIntakePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // A) Temel Bilgiler
    business_name: '',
    location: '',
    sector: '',
    target_audience: '',
    price_segment: 'mid',
    social_media_accounts: { instagram: '', tiktok: '', youtube: '' },
    
    // B) Hedefler
    three_month_goals: '',
    one_year_goals: '',
    
    // C) Ana Sorunlar
    main_challenges: '',
    previous_agency_experience: '',
    
    // D) İçerik Alışkanlıkları
    active_platforms: [] as string[],
    camera_comfort_level: 'medium',
    weekly_content_capacity: 3,
    best_performing_video_link: '',
    best_performing_video_reason: '',
    content_production_bottleneck: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/clients/${clientId}`);
      } else {
        alert('Form kaydedilirken hata oluştu');
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Müşteri İlk Görüşme Formu</h1>
          <p className="text-gray-600 mt-1">Adım {step} / 6</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form içeriği devam edecek */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-center text-gray-500">Form yükleniyor...</p>
          </div>
        </form>
      </div>
    </div>
  );
}
