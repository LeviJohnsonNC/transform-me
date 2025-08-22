import React from 'react';
import { Settings as SettingsIcon, Download, Upload, RotateCcw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabitStore } from '@/stores/habitStore';
import { useHabitEntries } from '@/hooks/useHabits';
import { CORE_HABITS } from '@/types/habits';

export const Settings: React.FC = () => {
  const { getStreakData } = useHabitStore();
  const { data: entries = [] } = useHabitEntries();
  const streakData = getStreakData(entries);
  
  const totalEntries = entries.length;
  const completedEntries = entries.filter(e => e.completed).length;
  const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

  const handleExportData = () => {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      entries,
      habits: CORE_HABITS
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transform-habits-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.entries && Array.isArray(data.entries)) {
              // Here you would typically call a store method to import data
              console.log('Import data:', data);
              alert('Import functionality would be implemented here');
            }
          } catch (error) {
            alert('Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.removeItem('transform-habits');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your Transform app
            </p>
          </div>
          <SettingsIcon className="text-primary-neon" size={24} />
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Statistics */}
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-neon">
                {streakData.current}
              </div>
              <div className="text-sm text-muted-foreground">
                Current Streak
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {streakData.longest}
              </div>
              <div className="text-sm text-muted-foreground">
                Longest Streak
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {completionRate}%
              </div>
              <div className="text-sm text-muted-foreground">
                Completion Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {totalEntries}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Entries
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">About Transform</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Habits</span>
              <span>{CORE_HABITS.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage</span>
              <span>Local Only</span>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Data Management</h2>
          <div className="space-y-3">
            <Button
              onClick={handleExportData}
              className="w-full justify-start"
              variant="ghost"
            >
              <Download size={18} className="mr-3" />
              Export Data
            </Button>
            
            <Button
              onClick={handleImportData}
              className="w-full justify-start"
              variant="ghost"
            >
              <Upload size={18} className="mr-3" />
              Import Data
            </Button>
            
            <Button
              onClick={handleResetData}
              className="w-full justify-start text-danger hover:text-danger"
              variant="ghost"
            >
              <RotateCcw size={18} className="mr-3" />
              Reset All Data
            </Button>
          </div>
        </div>

        {/* Phase 2 Placeholders */}
        <div className="bg-card/30 rounded-card p-6 opacity-50">
          <h2 className="text-lg font-semibold mb-4">Coming Soon</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield size={18} />
              <span>Coach Module</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <SettingsIcon size={18} />
              <span>Advanced Analytics</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <SettingsIcon size={18} />
              <span>Gamification</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            These features will be available in Phase 2 of Transform.
          </p>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Undo last action</span>
              <code className="bg-muted/30 px-2 py-1 rounded text-xs">
                Ctrl/Cmd + Z
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for habit transformation
          </p>
        </div>
      </div>
    </div>
  );
};