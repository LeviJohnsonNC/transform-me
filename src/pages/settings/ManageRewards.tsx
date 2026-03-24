import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Gift, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRewardSettings, useAddReward, useUpdateReward, useDeleteReward, type RewardSetting } from '@/hooks/useRewardSettings';

interface ManageRewardsProps {
  onBack: () => void;
}

export const ManageRewards: React.FC<ManageRewardsProps> = ({ onBack }) => {
  const { data: rewards = [], isLoading } = useRewardSettings();
  const addReward = useAddReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isAdding, setIsAdding] = useState<'standard' | 'boss' | null>(null);

  const standardRewards = rewards.filter(r => r.type === 'standard');
  const bossReward = rewards.find(r => r.type === 'boss');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-neon" />
      </div>
    );
  }

  const startEdit = (reward: RewardSetting) => {
    setIsAdding(null);
    setEditingId(reward.id);
    setEditTitle(reward.title);
    setEditDesc(reward.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(null);
    setEditTitle('');
    setEditDesc('');
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    if (isAdding) {
      const maxOrder = standardRewards.length > 0 ? Math.max(...standardRewards.map(r => r.sort_order)) : -1;
      await addReward.mutateAsync({
        type: isAdding,
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        sort_order: isAdding === 'boss' ? 0 : maxOrder + 1,
      });
      toast({ title: isAdding === 'boss' ? 'Boss reward set' : 'Reward added' });
    } else if (editingId) {
      await updateReward.mutateAsync({
        id: editingId,
        updates: { title: editTitle.trim(), description: editDesc.trim() || undefined },
      });
      toast({ title: 'Reward updated' });
    }
    cancelEdit();
  };

  const handleDelete = async (id: string) => {
    await deleteReward.mutateAsync(id);
    cancelEdit();
    toast({ title: 'Reward deleted' });
  };

  const handleToggleActive = async (reward: RewardSetting) => {
    await updateReward.mutateAsync({
      id: reward.id,
      updates: { is_active: !reward.is_active },
    });
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= standardRewards.length) return;

    await Promise.all([
      updateReward.mutateAsync({ id: standardRewards[index].id, updates: { sort_order: standardRewards[swapIndex].sort_order } }),
      updateReward.mutateAsync({ id: standardRewards[swapIndex].id, updates: { sort_order: standardRewards[index].sort_order } }),
    ]);
  };

  const renderEditForm = (onCancel: () => void) => (
    <div className="border-t border-border/50 p-3 space-y-3">
      <Input
        value={editTitle}
        onChange={e => setEditTitle(e.target.value)}
        placeholder="Reward title"
        autoFocus
      />
      <Input
        value={editDesc}
        onChange={e => setEditDesc(e.target.value)}
        placeholder="Description (optional)"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={addReward.isPending || updateReward.isPending}>
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Manage Rewards</h1>
            <p className="text-sm text-muted-foreground">
              {standardRewards.length} standard · {bossReward ? '1 boss' : 'No boss reward'}
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Explanation */}
        <div className="bg-card/30 rounded-card p-4 border border-border/50">
          <p className="text-sm text-muted-foreground">
            Standard rewards are randomly unlocked at Levels 1–9. Your boss reward is reserved for Level 10.
          </p>
        </div>

        {/* Boss Reward */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Trophy size={14} /> Boss Reward · Level 10
          </h2>
          {bossReward ? (
            <div className="bg-card/30 rounded-card border border-amber-500/20 overflow-hidden">
              <button
                className="w-full text-left p-3 flex items-center gap-3"
                onClick={() => editingId === bossReward.id ? cancelEdit() : startEdit(bossReward)}
              >
                <Trophy size={18} className="text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{bossReward.title}</p>
                  {bossReward.description && (
                    <p className="text-xs text-muted-foreground truncate">{bossReward.description}</p>
                  )}
                </div>
              </button>
              {editingId === bossReward.id && (
                <div className="border-t border-border/50 p-3 space-y-3">
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Reward title" />
                  <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description (optional)" />
                  <div className="flex justify-end gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 size={14} className="mr-1" /> Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove boss reward?</AlertDialogTitle>
                          <AlertDialogDescription>You can set a new one anytime.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(bossReward.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                    <Button size="sm" onClick={handleSave}>Save</Button>
                  </div>
                </div>
              )}
            </div>
          ) : isAdding === 'boss' ? (
            <div className="bg-card/30 rounded-card border border-primary/50 p-3 space-y-3">
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Boss reward title" autoFocus />
              <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description (optional)" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                <Button size="sm" onClick={handleSave}>Save</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => { setIsAdding('boss'); setEditingId(null); setEditTitle(''); setEditDesc(''); }}>
              <Trophy size={16} className="mr-2" /> Set Boss Reward
            </Button>
          )}
        </div>

        {/* Standard Rewards */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Gift size={14} /> Standard Rewards · Levels 1–9
          </h2>
          <div className="space-y-2">
            {standardRewards.map((reward, index) => {
              const isEditing = editingId === reward.id;
              return (
                <div
                  key={reward.id}
                  className={`bg-card/30 rounded-card border border-border/50 overflow-hidden transition-opacity ${!reward.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === 0} onClick={() => handleMove(index, 'up')}>
                        <ChevronUp size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === standardRewards.length - 1} onClick={() => handleMove(index, 'down')}>
                        <ChevronDown size={14} />
                      </Button>
                    </div>
                    <button
                      className="flex items-center gap-3 flex-1 text-left min-w-0"
                      onClick={() => isEditing ? cancelEdit() : startEdit(reward)}
                    >
                      <Gift size={18} className="text-primary-neon shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{reward.title}</p>
                        {reward.description && <p className="text-xs text-muted-foreground truncate">{reward.description}</p>}
                      </div>
                    </button>
                    <Switch checked={reward.is_active} onCheckedChange={() => handleToggleActive(reward)} />
                  </div>
                  {isEditing && (
                    <div className="border-t border-border/50 p-3 space-y-3">
                      <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Reward title" />
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description (optional)" />
                      <div className="flex justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 size={14} className="mr-1" /> Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this reward?</AlertDialogTitle>
                              <AlertDialogDescription>Previously unlocked instances will keep their snapshot.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(reward.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                        <Button size="sm" onClick={handleSave}>Save</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isAdding === 'standard' ? (
              <div className="bg-card/30 rounded-card border border-primary/50 p-3 space-y-3">
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Reward title" autoFocus />
                <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description (optional)" />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={handleSave}>Add</Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setIsAdding('standard'); setEditingId(null); setEditTitle(''); setEditDesc(''); }}
              >
                <Plus size={18} className="mr-2" /> Add Standard Reward
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
