import React, { useState } from 'react';
import { ArrowLeft, Download, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useHabitEntries, useUserHabits } from '@/hooks/useHabits';
import { todayKey } from '@/lib/dates';
import { toast } from 'sonner';

interface DataManagementProps {
  onBack: () => void;
}

/**
 * Every table the app owns, with the column to page on. Mirrors the list in
 * `scripts/backup-and-audit.js` — an export that covers only some tables is not
 * a backup, and the previous version covered two of these nine.
 *
 * `user_stats` is keyed on `user_id`, not `id`.
 */
const TABLES: Array<[table: string, orderColumn: string]> = [
  ['habits', 'id'],
  ['habit_entries', 'id'],
  ['workout_plans', 'id'],
  ['workout_exercises', 'id'],
  ['workout_records', 'id'],
  ['reward_settings', 'id'],
  ['cycle_progress', 'id'],
  ['cycle_level_unlocks', 'id'],
  ['user_stats', 'user_id'],
];

/** PostgREST caps a request at 1000 rows and does not say so. Page past it. */
const PAGE_SIZE = 1000;

const fetchAll = async (table: string, orderColumn: string): Promise<unknown[]> => {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table as never)
      .select('*')
      .order(orderColumn, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
};

export const DataManagement: React.FC<DataManagementProps> = ({ onBack }) => {
  const { data: entries = [] } = useHabitEntries();
  const { data: habits = [] } = useUserHabits();
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const tables: Record<string, unknown[]> = {};
      for (const [table, orderColumn] of TABLES) {
        tables[table] = await fetchAll(table, orderColumn);
      }

      const payload = {
        version: 2,
        exportedAt: new Date().toISOString(),
        tables,
        counts: Object.fromEntries(Object.entries(tables).map(([t, r]) => [t, r.length])),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transform-me-${todayKey()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const total = Object.values(payload.counts).reduce((n, c) => n + c, 0);
      toast.success('Export ready', {
        description: `${total} rows across ${TABLES.length} tables.`,
      });
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-surface edge-rule">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2 text-faint">
            <ArrowLeft size={18} />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-[15px] tracking-[0.06em]">DATA</h1>
            <Database className="text-cyan" size={18} />
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-5">
        <div className="surface chamfer p-5">
          <h2 className="font-display text-[10px] tracking-[0.2em] text-faint mb-3">BACKUP</h2>
          <Button
            onClick={handleExportData}
            disabled={exporting}
            className="w-full h-11 rounded-none chamfer-sm font-display font-bold tracking-[0.12em] bg-cyan text-[#06121A] hover:bg-cyan-soft disabled:bg-[#150E28] disabled:text-dim disabled:opacity-100"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Download size={16} className="mr-2" />
            )}
            {exporting ? 'EXPORTING' : 'EXPORT EVERYTHING'}
          </Button>
          <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">
            Downloads all {TABLES.length} tables as JSON — habits, entries, workout plans and
            records, rewards and cycle progress.
          </p>
        </div>

        <div className="surface chamfer p-5">
          <h2 className="font-display text-[10px] tracking-[0.2em] text-faint mb-3">STORAGE</h2>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Habits</span>
              <span className="tabular">{habits.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Habit entries</span>
              <span className="tabular">{entries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stored in</span>
              <span>Supabase</span>
            </div>
          </div>
        </div>

        {/* Import and Reset used to live here. Import parsed the file and then
            alerted that import "would be implemented here". Reset warned that it
            could not be undone and then cleared a localStorage key that has not
            existed since the move to Lovable Cloud — a destructive-looking
            button that silently did nothing, which is the worse of the two.
            Both are gone rather than faked. */}
        <div className="surface-sunken chamfer p-5">
          <h2 className="font-display text-[10px] tracking-[0.2em] text-faint mb-3">
            NOT AVAILABLE HERE
          </h2>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            There is no import or reset. Restoring a backup means reconciling nine tables against
            whatever is already there, and neither is built yet. Export is a real backup; treat it
            as one-way for now.
          </p>
        </div>
      </div>
    </div>
  );
};
