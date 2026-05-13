'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Video,
  FileText,
  BarChart2,
  Hash,
  HelpCircle,
  Settings,
  User,
} from 'lucide-react';
import { LogoFull } from './Logo';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Müşteriler', href: '/clients' },
  { icon: Video, label: 'Videolar', href: '/videos' },
  { icon: FileText, label: 'Arazi Senaryo', href: '/tools/land-script' },
  { icon: BarChart2, label: 'Analitik', href: '/analytics' },
  { icon: Hash, label: "Hashtag'ler", href: '/hashtags' },
  { icon: HelpCircle, label: 'Görüşme Soruları', href: '/settings/questions' },
  { icon: Settings, label: 'Ayarlar', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 min-h-screen fixed left-0 top-0 flex flex-col no-print"
      style={{ backgroundColor: '#0c1e3d', borderRight: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Logo */}
      <div
        className="px-4 h-14 flex items-center shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <LogoFull theme="dark" size={26} />
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">
          Menü
        </p>
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="p-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-white/[0.06] cursor-pointer transition-colors">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <User className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin</p>
            <p className="text-xs text-blue-400/70">Yönetici</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
