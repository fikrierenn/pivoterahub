import { supabase } from '@/lib/supabase';
import DashboardWidget from '@/components/charts/DashboardWidget';
import { Users, Video, Star, Hash, CheckCircle, Circle } from 'lucide-react';

async function getDashboardStats() {
  try {
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    const { data: allClients } = await supabase.from('clients').select('status');

    const clientsWithStatus = (allClients || []).map(c => ({
      ...c,
      status: c.status || 'lead',
    }));

    const { count: videosCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    const { data: scores } = await supabase
      .from('video_scores')
      .select('hook_score, tempo_score, clarity_score, cta_score, visual_score');

    let avgScore = 0;
    if (scores && scores.length > 0) {
      const total = scores.reduce(
        (sum, s) => sum + (s.hook_score + s.tempo_score + s.clarity_score + s.cta_score + s.visual_score) / 5,
        0,
      );
      avgScore = total / scores.length;
    }

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
  } catch {
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

  const statCards = [
    { label: 'Toplam Müşteri', value: stats.clients, Icon: Users },
    { label: 'Toplam Video', value: stats.videos, Icon: Video },
    { label: 'Ort. Skor', value: stats.avgScore, Icon: Star },
    { label: 'Aktif Hashtag', value: stats.hashtags, Icon: Hash },
  ];

  const statusItems = [
    { label: 'Lead', value: stats.statusBreakdown.lead, color: 'bg-blue-500' },
    { label: 'Prospect', value: stats.statusBreakdown.prospect, color: 'bg-amber-500' },
    { label: 'Active', value: stats.statusBreakdown.active, color: 'bg-emerald-500' },
    { label: 'Inactive', value: stats.statusBreakdown.inactive, color: 'bg-zinc-400' },
    { label: 'Completed', value: stats.statusBreakdown.completed, color: 'bg-violet-500' },
  ];

  return (
    <div className="py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Video analizi ve performans takibi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, Icon }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-zinc-500">{label}</p>
              <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-zinc-500" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-zinc-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Client Status */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium text-zinc-900 mb-4">Müşteri Durumu</h2>
        <div className="grid grid-cols-5 gap-3">
          {statusItems.map(({ label, value, color }) => (
            <div key={label} className="text-center p-4 bg-zinc-50 rounded-lg border border-zinc-100">
              <div className={`w-2 h-2 rounded-full ${color} mx-auto mb-2`}></div>
              <div className="text-xl font-semibold text-zinc-900">{value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-900 mb-4">Müşteri Durumu Dağılımı</h2>
          <DashboardWidget
            title=""
            data={[
              { name: 'Lead', value: stats.statusBreakdown.lead },
              { name: 'Prospect', value: stats.statusBreakdown.prospect },
              { name: 'Active', value: stats.statusBreakdown.active },
              { name: 'Inactive', value: stats.statusBreakdown.inactive },
              { name: 'Completed', value: stats.statusBreakdown.completed },
            ]}
            chartType="donut"
            size="medium"
            nameKey="name"
            dataKey="value"
          />
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-900 mb-4">Performans Trendi</h2>
          <DashboardWidget
            title=""
            data={[
              { name: 'Oca', value: 45 },
              { name: 'Şub', value: 52 },
              { name: 'Mar', value: 48 },
              { name: 'Nis', value: 61 },
              { name: 'May', value: 55 },
              { name: 'Haz', value: 67 },
              { name: 'Tem', value: 73 },
            ]}
            chartType="line"
            size="medium"
            nameKey="name"
            dataKey="value"
            color="#10B981"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-900 mb-4">Video Skorları</h3>
          <DashboardWidget
            title=""
            data={[
              { name: 'Hook', value: 7.2 },
              { name: 'Tempo', value: 6.8 },
              { name: 'Netlik', value: 8.1 },
              { name: 'CTA', value: 6.5 },
              { name: 'Görsel', value: 7.9 },
            ]}
            chartType="bar"
            size="small"
            nameKey="name"
            dataKey="value"
            color="#8B5CF6"
          />
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-900 mb-4">Aylık Büyüme</h3>
          <DashboardWidget
            title=""
            data={[
              { name: '1', value: 120 },
              { name: '2', value: 135 },
              { name: '3', value: 148 },
              { name: '4', value: 162 },
              { name: '5', value: 178 },
              { name: '6', value: 195 },
              { name: '7', value: 210 },
            ]}
            chartType="sparkline"
            size="small"
            nameKey="name"
            dataKey="value"
            color="#06B6D4"
          />
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-900 mb-4">Platform Dağılımı</h3>
          <DashboardWidget
            title=""
            data={[
              { name: 'Instagram', value: 65 },
              { name: 'TikTok', value: 25 },
              { name: 'YouTube', value: 10 },
            ]}
            chartType="pie"
            size="small"
            nameKey="name"
            dataKey="value"
          />
        </div>
      </div>

      {/* API Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {[
          {
            title: 'Video Analysis API',
            endpoint: 'POST /api/video-analysis',
            features: ['Gemini Transcription', 'AI Skorlama (Hook, Tempo, CTA, Visual)', 'Hashtag Stats Güncelleme'],
          },
          {
            title: 'Growth Report API',
            endpoint: 'POST /api/growth-report',
            features: ['Dönem Karşılaştırması', 'Video Performans Analizi', 'AI Değerlendirme (Türkçe)'],
          },
        ].map(({ title, endpoint, features }) => (
          <div key={title} className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-900">{title}</h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                Aktif
              </span>
            </div>
            <ul className="space-y-1.5 mb-4">
              {features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-zinc-100">
              <code className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded">{endpoint}</code>
            </div>
          </div>
        ))}
      </div>

      {/* Tech Stack */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="text-sm font-medium text-zinc-900 mb-4">Teknoloji Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Next.js 16', desc: 'App Router + Turbopack' },
            { name: 'Supabase', desc: 'PostgreSQL Database' },
            { name: 'Gemini + GPT-4o', desc: 'Video & Director AI' },
            { name: 'Claude Sonnet', desc: 'FrameAgent' },
          ].map(({ name, desc }) => (
            <div key={name} className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg">
              <div className="text-sm font-medium text-zinc-900">{name}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
