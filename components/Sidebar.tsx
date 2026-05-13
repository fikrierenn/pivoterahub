'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: '📊', label: 'Dashboard', href: '/' },
  { icon: '👥', label: 'Müşteriler', href: '/clients' },
  { icon: '🎥', label: 'Videolar', href: '/videos' },
  { icon: 'AS', label: 'Arazi Senaryo', href: '/tools/land-script' },
  { icon: '📈', label: 'Analitik', href: '/analytics' },
  { icon: '#️⃣', label: 'Hashtag\'ler', href: '/hashtags' },
  { icon: '❓', label: 'Görüşme Soruları', href: '/settings/questions' },
  { icon: '⚙️', label: 'Ayarlar', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen fixed left-0 top-0 backdrop-blur-xl border-r border-slate-700/50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ClientBrain
            </h1>
            <p className="text-xs text-slate-400">AI Danışmanlık Sistemi</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:transform hover:scale-[1.01]'
                  }`}
                >
                  <span className={`text-xl transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Stats */}
      <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Hızlı Özet</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Aktif Müşteri</span>
            <span className="text-green-400 font-medium">12</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Bu Ay Video</span>
            <span className="text-blue-400 font-medium">48</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Ortalama Skor</span>
            <span className="text-purple-400 font-medium">7.2</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/30 rounded-xl">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lg">👤</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-slate-400">Çevrimiçi</p>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </aside>
  );
}
