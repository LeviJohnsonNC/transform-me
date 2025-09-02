import React from 'react';
import { ArrowLeft, Download, Upload, RotateCcw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabitEntries } from '@/hooks/useHabits';
import { CORE_HABITS } from '@/types/habits';

interface DataManagementProps {
  onBack: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onBack }) => {
  const { data: entries = [] } = useHabitEntries();

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
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Data Management</h1>
            <Database className="text-primary-neon" size={20} />
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Data Management */}
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Backup & Restore</h2>
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

        {/* Data Info */}
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Storage Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Entries</span>
              <span>{entries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage Type</span>
              <span>Local Storage</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Format</span>
              <span>JSON</span>
            </div>
          </div>
        </div>

        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Privacy</h2>
          <p className="text-sm text-muted-foreground">
            All your data is stored locally on your device. We do not collect, 
            store, or transmit any personal information to external servers.
          </p>
        </div>
      </div>
    </div>
  );
};