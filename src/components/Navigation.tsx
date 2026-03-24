import React from 'react';
import { Calendar, Settings, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const navItems = [
  { id: 'today', label: 'Today', icon: Target, path: '/' },
  { id: 'history', label: 'History', icon: Calendar, path: '/history' },
  { id: 'records', label: 'Records', icon: Trophy, path: '/records' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
];

export const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/[0.04]" style={{ borderRadius: 0 }}>
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
                'hover:bg-white/[0.03] active:scale-95',
                isActive && 'bg-primary/10 text-primary-neon'
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  'transition-colors duration-200',
                  isActive ? 'text-primary-neon' : 'text-muted-foreground'
                )}
              />
              <span className={cn(
                'text-xs font-medium transition-colors duration-200',
                isActive ? 'text-primary-neon' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
