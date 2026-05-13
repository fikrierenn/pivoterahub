import { supabase } from '@/lib/supabase';
import DashboardWidget from '@/components/charts/DashboardWidget';

async function getDashboardStats() {
  try {
    // Get total clients
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    // Get clients by status
    const { data: allClients } = await supabase
      .from('clients')
      .select('*');
    
    // Ensure status field exists
    const clientsWithStatus = (allClients || []).map(c => ({
      ...c,
      status: c.status || 'lead'
    }));

    // Get total videos
    const { count: videosCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    // Get average score
    const { data: scores } = await supabase
      .from('video_scores')
      .select('hook_score, tempo_score, clarity_score, cta_score, visual_score');

    let avgScore = 0;
    if (scores && scores.length > 0) {
      const totalScore = scores.reduce((sum, score) => {
        return sum + (score.hook_score + score.tempo_score + score.clarity_score + score.cta_score + score.visual_score) / 5;
      }, 0);
      avgScore = totalScore / scores.length;
    }

    // Get total hashtags
    const { count: hashtagsCount } = await supabase
      .from('hashtag_stats')
      .select('*', { count: 'exact', head: true });

    const statusBreakdown = {
      lead: clientsWithStatus.filter(c => c.status === 'lead').length,
      prospect: clientsWithStatus.filter(c => c.status === 'prospect').length,
      active: clientsWithStatus.filter(c => c.status === 'active').length,
      inactive: clientsWithStatus.filter(c => c.status === 'inactive').length,
      completed: clientsWithStatus.filter(c => c.status === 'completed').length,
    };

    return {
      clients: clientsCount || 0,
      videos: videosCount || 0,
      avgScore: avgScore.toFixed(1),
      hashtags: hashtagsCount || 0,
      statusBreakdown,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      clients: 0,
      videos: 0,
      avgScore: '0.0',
      hashtags: 0,
      statusBreakdown: { lead: 0, prospect: 0, active: 0, inactive: 0, completed: 0 },
    };
  }
}

export default async function Home() {
  const stats = await getDashboardStats();
  
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Video analizi ve performans takibi özeti</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Müşteri</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.clients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Video</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.videos}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ort. Skor</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgScore}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Hashtag</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.hashtags}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">#️⃣</span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Müşteri Durumu</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">🔵</div>
            <div className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.lead}</div>
            <div className="text-sm text-gray-600">Lead</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl mb-2">🟡</div>
            <div className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.prospect}</div>
            <div className="text-sm text-gray-600">Prospect</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl mb-2">🟢</div>
            <div className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">⚪</div>
            <div className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.inactive}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Müşteri Durumu Dağılımı</h2>
          <DashboardWidget
            title=""
            data={[
              { name: 'Lead', value: stats.statusBreakdown.lead },
              { name: 'Prospect', value: stats.statusBreakdown.prospect },
              { name: 'Active', value: stats.statusBreakdown.active },
              { name: 'Inactive', value: stats.statusBreakdown.inactive },
              { name: 'Completed', value: stats.statusBreakdown.completed }
            ]}
            chartType="donut"
            size="medium"
            nameKey="name"
            dataKey="value"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performans Trendi</h2>
          <DashboardWidget
            title=""
            data={[
              { name: 'Oca', value: 45 },
              { name: 'Şub', value: 52 },
              { name: 'Mar', value: 48 },
              { name: 'Nis', value: 61 },
              { name: 'May', value: 55 },
              { name: 'Haz', value: 67 },
              { name: 'Tem', value: 73 }
            ]}
            chartType="line"
            size="medium"
            nameKey="name"
            dataKey="value"
            color="#10B981"
          />
        </div>
      </div>

      {/* Quick Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Video Skorları</h3>
          <DashboardWidget
            title=""
            data={[
              { name: 'Hook', value: 7.2 },
              { name: 'Tempo', value: 6.8 },
              { name: 'Netlik', value: 8.1 },
              { name: 'CTA', value: 6.5 },
              { name: 'Görsel', value: 7.9 }
            ]}
            chartType="bar"
            size="small"
            nameKey="name"
            dataKey="value"
            color="#8B5CF6"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Aylık Büyüme</h3>
          <DashboardWidget
            title=""
            data={[
              { name: '1', value: 120 },
              { name: '2', value: 135 },
              { name: '3', value: 148 },
              { name: '4', value: 162 },
              { name: '5', value: 178 },
              { name: '6', value: 195 },
              { name: '7', value: 210 }
            ]}
            chartType="sparkline"
            size="small"
            nameKey="name"
            dataKey="value"
            color="#06B6D4"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Platform Dağılımı</h3>
          <DashboardWidget
            title=""
            data={[
              { name: 'Instagram', value: 65 },
              { name: 'TikTok', value: 25 },
              { name: 'YouTube', value: 10 }
            ]}
            chartType="pie"
            size="small"
            nameKey="name"
            dataKey="value"
          />
        </div>
      </div>

      {/* API Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Video Analysis API</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Aktif
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Video analizi, Whisper transkript, AI skorlama ve hashtag güncelleme
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-700">
              <span className="mr-2 text-green-500">✓</span>
              <span>Whisper Transcription</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="mr-2 text-green-500">✓</span>
              <span>AI Skorlama (Hook, Tempo, CTA, Visual)</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="mr-2 text-green-500">✓</span>
              <span>Hashtag Stats Güncelleme</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              POST /api/video-analysis
            </code>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Growth Report API</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Aktif
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Gelişim analizi, dönem karşılaştırması ve AI değerlendirmesi
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-700">
              <span className="mr-2 text-green-500">✓</span>
              <span>Dönem Karşılaştırması</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="mr-2 text-green-500">✓</span>
              <span>Video Performans Analizi</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="mr-2 text-green-500">✓</span>
              <span>AI Değerlendirme (Türkçe)</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              POST /api/growth-report
            </code>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Teknoloji Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold text-gray-900">Next.js 16</div>
            <div className="text-xs text-gray-600 mt-1">App Router + Turbopack</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🗄️</div>
            <div className="font-semibold text-gray-900">Supabase</div>
            <div className="text-xs text-gray-600 mt-1">PostgreSQL Database</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-semibold text-gray-900">OpenAI</div>
            <div className="text-xs text-gray-600 mt-1">GPT-4o-mini</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🎙️</div>
            <div className="font-semibold text-gray-900">Whisper</div>
            <div className="text-xs text-gray-600 mt-1">Audio Transcription</div>
          </div>
        </div>
      </div>
    </div>
  );
}