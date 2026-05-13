'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DynamicFormRenderer, { FormQuestion, FormCategory } from '@/components/DynamicFormRenderer';

export default function ClientIntakePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<any>(null);
  const [formTemplate, setFormTemplate] = useState<FormCategory[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentCategory, setCurrentCategory] = useState(0);

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId]);

  const loadData = async () => {
    try {
      // Load client data
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        setClient(clientData.client);
        
        // If intake form exists, populate form data
        if (clientData.intakeForm?.answers) {
          setFormData(clientData.intakeForm.answers);
        }
      }

      // Load form template
      const templateResponse = await fetch('/api/intake-questions');
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        if (templateData.template?.questions) {
          setFormTemplate(templateData.template.questions);
        } else {
          // Fallback to minimal template
          const minimalTemplate = await import('@/lib/minimal-intake-template.json');
          setFormTemplate(minimalTemplate.default);
        }
      } else {
        // Fallback to minimal template
        const minimalTemplate = await import('@/lib/minimal-intake-template.json');
        setFormTemplate(minimalTemplate.default);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to minimal template
      try {
        const minimalTemplate = await import('@/lib/minimal-intake-template.json');
        setFormTemplate(minimalTemplate.default);
      } catch (fallbackError) {
        console.error('Error loading fallback template:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    formTemplate.forEach(category => {
      category.questions.forEach(question => {
        if (question.required && !formData[question.key]?.trim()) {
          newErrors[question.key] = 'Bu alan zorunludur';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleSave = async (isComplete = false) => {
    if (isComplete && !validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: formData,
          is_complete: isComplete
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kaydetme başarısız');
      }

      if (isComplete) {
        // Redirect to client detail page
        router.push(`/clients/${clientId}`);
      } else {
        // Show success message for draft save
        alert('Form taslak olarak kaydedildi');
      }
      
    } catch (error: any) {
      console.error('Save error:', error);
      alert(error.message || 'Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleValidation = (key: string, value: any): string | null => {
    // Custom validation logic can be added here
    return null;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-2xl">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-2xl">Müşteri bulunamadı</div>
        </div>
      </div>
    );
  }

  const totalCategories = formTemplate.length;
  const progress = totalCategories > 0 ? ((currentCategory + 1) / totalCategories) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">Müşteri Görüşme Formu</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => router.push(`/clients/${clientId}`)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ← Geri Dön
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              İlerleme: {currentCategory + 1} / {totalCategories}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          {formTemplate.map((category, index) => (
            <button
              key={category.category}
              onClick={() => setCurrentCategory(index)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentCategory === index
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {category.category_label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        {formTemplate[currentCategory] && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {formTemplate[currentCategory].category_label}
            </h2>

            <DynamicFormRenderer
              categories={[formTemplate[currentCategory]]}
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onValidate={handleValidation}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                {currentCategory > 0 && (
                  <button
                    onClick={() => setCurrentCategory(currentCategory - 1)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    ← Önceki
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : '💾 Taslak Kaydet'}
                </button>

                {currentCategory < totalCategories - 1 ? (
                  <button
                    onClick={() => setCurrentCategory(currentCategory + 1)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Sonraki →
                  </button>
                ) : (
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Kaydediliyor...' : '✅ Formu Tamamla'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Summary */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Form Hakkında</h3>
          <p className="text-blue-800 text-sm">
            Bu form, size özel AI destekli analiz ve strateji oluşturmak için gerekli bilgileri toplar. 
            Tüm alanları doldurmanız, daha doğru ve kişiselleştirilmiş öneriler almanızı sağlar.
          </p>
        </div>
      </div>
    </div>
  );
}