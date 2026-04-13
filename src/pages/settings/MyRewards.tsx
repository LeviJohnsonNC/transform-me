import React from 'react';
import { ArrowLeft, Trophy, Check, Gift, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClaimReward } from '@/hooks/useCycleProgression';
import { format } from 'date-fns';

interface MyRewardsProps {
  onBack: () => void;
}

interface UnlockRow {
  id: string;
  cycle_id: string;
  level: number;
  reward_type: string;
  reward_title_snapshot: string;
  reward_description_snapshot: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
  unlocked_at: string;
}

interface CycleRow {
  id: string;
  cycle_number: number;
}

export const MyRewards: React.FC<MyRewardsProps> = ({ onBack }) => {
  const claimReward = useClaimReward();

  const { data: unlocks = [], isLoading: unlocksLoading } = useQuery({
    queryKey: ['all-cycle-unlocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycle_level_unlocks')
        .select('*')
        .order('unlocked_at', { ascending: false });
      if (error) throw error;
      return (data || []) as UnlockRow[];
    },
  });

  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
    queryKey: ['all-cycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycle_progress')
        .select('id, cycle_number')
        .order('cycle_number', { ascending: false });
      if (error) throw error;
      return (data || []) as CycleRow[];
    },
  });

  const isLoading = unlocksLoading || cyclesLoading;

  const cycleMap = new Map(cycles.map(c => [c.id, c.cycle_number]));

  // Group unlocks by cycle
  const grouped = unlocks.reduce<Record<number, UnlockRow[]>>((acc, u) => {
    const num = cycleMap.get(u.cycle_id) || 0;
    if (!acc[num]) acc[num] = [];
    acc[num].push(u);
    return acc;
  }, {});

  const sortedCycleNums = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">My Rewards</h1>
            <p className="text-xs text-muted-foreground">View and redeem unlocked rewards</p>
          </div>
          <Trophy className="ml-auto text-primary" size={20} />
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : unlocks.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto mb-3 text-muted-foreground" size={40} />
            <p className="text-muted-foreground">No rewards unlocked yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Keep building your streak to earn rewards!</p>
          </div>
        ) : (
          sortedCycleNums.map(cycleNum => (
            <div key={cycleNum}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Cycle {cycleNum}
              </h2>
              <div className="space-y-3">
                {grouped[cycleNum]
                  .sort((a, b) => b.level - a.level)
                  .map(unlock => (
                    <div
                      key={unlock.id}
                      className="bg-card/30 border border-border/30 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {unlock.reward_type === 'boss' ? (
                            <Crown size={16} className="text-yellow-400" />
                          ) : (
                            <Gift size={16} className="text-primary" />
                          )}
                          <span className="font-semibold text-sm">Lv. {unlock.level}</span>
                          <Badge
                            variant={unlock.reward_type === 'boss' ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {unlock.reward_type === 'boss' ? 'Boss' : 'Standard'}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(unlock.unlocked_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-medium">{unlock.reward_title_snapshot}</p>
                        {unlock.reward_description_snapshot && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {unlock.reward_description_snapshot}
                          </p>
                        )}
                      </div>

                      {unlock.is_claimed ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <Check size={14} />
                          <span>Redeemed{unlock.claimed_at ? ` · ${format(new Date(unlock.claimed_at), 'MMM d')}` : ''}</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-8"
                          onClick={() => claimReward.mutate(unlock.id)}
                          disabled={claimReward.isPending}
                        >
                          Mark as Redeemed
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
