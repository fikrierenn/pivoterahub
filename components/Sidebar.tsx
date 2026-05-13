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
    <aside className="w-56 bg-zinc-950 border-r border-white/[0.06] min-h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="px-4 h-12 flex items-center border-b border-white/[0.06] shrink-0">
        <span className="text-white font-semibold text-sm tracking-tight">PivotaraHub</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
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
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
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
      <div className="border-t border-white/[0.06] p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-white/[0.04] cursor-pointer transition-colors">
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <span className="text-sm text-zinc-400 flex-1">Admin</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
        </div>
      </div>
    </aside>
  );
}
