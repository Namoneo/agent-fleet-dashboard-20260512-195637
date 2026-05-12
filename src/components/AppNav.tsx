'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  CheckSquare2,
  FileText,
  GitBranch,
  Activity,
  Terminal,
} from 'lucide-react';

const links = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare2 },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/activity', label: 'Activity', icon: Activity },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 h-11 overflow-x-auto">
          <div className="flex items-center gap-2 pr-4 mr-2 border-r border-gray-200 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-900 hidden sm:inline">Fleet</span>
          </div>
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-90" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
