import React from 'react';
import { Calendar, Settings, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const navItems = [
  { id: 'today', label: 'TODAY', icon: Target, path: '/' },
  { id: 'history', label: 'HISTORY', icon: Calendar, path: '/history' },
  { id: 'records', label: 'RECORDS', icon: Trophy, path: '/records' },
  { id: 'settings', label: 'SETTINGS', icon: Settings, path: '/settings' },
];

export const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0518] border-t border-cyan/[0.16] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-2.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.path;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex-1 flex flex-col items-center gap-[5px] pt-[11px] pb-[7px] transition-colors duration-200"
            >
              {/* Lit rule above the active tab. */}
              {isActive && (
                <span
                  className="absolute top-0 left-[18%] right-[18%] h-0.5 bg-cyan"
                  style={{ boxShadow: '0 0 10px hsl(var(--cyan))' }}
                  aria-hidden="true"
                />
              )}
              <Icon
                size={20}
                strokeWidth={1.9}
                className={cn('transition-colors duration-200', isActive ? 'text-cyan' : 'text-[#7D76A8]')}
              />
              <span
                className={cn(
                  'font-display text-[10px] font-semibold tracking-[0.13em] transition-colors duration-200',
                  isActive ? 'text-cyan' : 'text-[#7D76A8]',
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
