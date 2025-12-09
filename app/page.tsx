export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎬 ClientBrain Video Modülü
          </h1>
          <p className="text-xl text-gray-600">
            Video Analizi, Performans Takibi ve Hashtag Analitiği
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                ✅ Sistem Hazır
              </h2>
              <p className="text-gray-600">
                Tüm API endpoint'leri aktif ve çalışıyor
              </p>
            </div>
            <div className="text-green-500 text-6xl">●</div>
          </div>
        </div>

        {/* API Endpoints Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Video Analysis Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start mb-4">
              <div className="bg-blue-100 rounded-lg p-3 mr-4">
                <span className="text-3xl">🎥</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  Video Analysis
                </h3>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  POST /api/video-analysis
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Video analizi, Whisper transkript, AI skorlama ve hashtag güncelleme
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✓</span>
                <span>Whisper Transcription</span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✓</span>
                <span>AI Skorlama (Hook, Tempo, CTA, Visual)</span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✓</span>
                <span>Hashtag Stats Güncelleme</span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✓</span>
                <span>Performans Metrikleri</span>
              </div>
            </div>
          </div>

          {/* Growth Report Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start mb-4">
              <div className="bg-purple-100 rounded-lg p-3 mr-4">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  Growth Report
                </h3>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  POST /api/growth-report
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Gelişim analizi, dönem karşılaştırması ve AI değerlendirmesi
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✓</span>
                <span>Dönem Karşılaştırması</span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✓</span>
                <span>Video Performans Analizi</span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✓</span>
                <span>Top & Weak Hashtags</span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="mr-2">✓</span>
                <span>AI Değerlendirme (Türkçe)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🛠️ Teknoloji Stack
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold text-gray-800">Next.js 16</div>
              <div className="text-xs text-gray-600">App Router</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🗄️</div>
              <div className="font-semibold text-gray-800">Supabase</div>
              <div className="text-xs text-gray-600">PostgreSQL</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-semibold text-gray-800">OpenAI</div>
              <div className="text-xs text-gray-600">GPT-4o-mini</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🎙️</div>
              <div className="font-semibold text-gray-800">Whisper</div>
              <div className="text-xs text-gray-600">Transcription</div>
            </div>
          </div>
        </div>

        {/* Database Tables */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            💾 Database Tables
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded text-sm font-medium text-center">
              clients
            </div>
            <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded text-sm font-medium text-center">
              videos
            </div>
            <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded text-sm font-medium text-center">
              video_scores
            </div>
            <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded text-sm font-medium text-center">
              video_stats
            </div>
            <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded text-sm font-medium text-center">
              hashtag_stats
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            🚀 Proje hazır! API endpoint'lerini Postman veya curl ile test edebilirsin.
          </p>
        </div>
      </div>
    </main>
  );
}
