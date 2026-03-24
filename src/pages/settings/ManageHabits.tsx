import React, { useState } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { useAllHabits, useUpdateHabit, useAddHabit, useDeleteHabit, useReorderHabits } from '@/hooks/useHabits';
import { getHabitIcon } from '@/utils/habitIcons';
import { IconPicker } from '@/components/IconPicker';
import type { Habit } from '@/types/habits';

interface ManageHabitsProps {
  onBack: () => void;
}

interface EditState {
  name: string;
  description: string;
  icon: string;
  activeOnWeekdays: boolean;
  activeOnWeekends: boolean;
}

export const ManageHabits: React.FC<ManageHabitsProps> = ({ onBack }) => {
  const { data: habits, isLoading } = useAllHabits();
  const updateHabit = useUpdateHabit();
  const addHabit = useAddHabit();
  const deleteHabit = useDeleteHabit();
  const reorderHabits = useReorderHabits();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', description: '', icon: 'Dumbbell' });
  const [isAdding, setIsAdding] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-neon"></div>
      </div>
    );
  }

  const sortedHabits = habits || [];
  const activeCount = sortedHabits.filter(h => h.isActive).length;

  const startEdit = (habit: Habit) => {
    setIsAdding(false);
    setEditingId(habit.id);
    setEditState({ name: habit.name, description: habit.description || '', icon: habit.icon });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!editState.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    if (isAdding) {
      const maxOrder = sortedHabits.length > 0 ? Math.max(...sortedHabits.map(h => h.orderIndex)) : -1;
      await addHabit.mutateAsync({
        name: editState.name.trim(),
        description: editState.description.trim(),
        icon: editState.icon,
        order_index: maxOrder + 1,
      });
      toast({ title: 'Habit added' });
    } else if (editingId) {
      await updateHabit.mutateAsync({
        id: editingId,
        updates: {
          name: editState.name.trim(),
          description: editState.description.trim(),
          icon: editState.icon,
        },
      });
      toast({ title: 'Habit updated' });
    }
    cancelEdit();
  };

  const handleToggleActive = async (habit: Habit) => {
    await updateHabit.mutateAsync({
      id: habit.id,
      updates: { is_active: !habit.isActive },
    });
    toast({ title: habit.isActive ? 'Habit deactivated' : 'Habit activated' });
  };

  const handleDelete = async (habitId: string) => {
    await deleteHabit.mutateAsync(habitId);
    cancelEdit();
    toast({ title: 'Habit deleted' });
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sortedHabits.length) return;

    const updates = [
      { id: sortedHabits[index].id, order_index: sortedHabits[swapIndex].orderIndex },
      { id: sortedHabits[swapIndex].id, order_index: sortedHabits[index].orderIndex },
    ];
    await reorderHabits.mutateAsync(updates);
  };

  const startAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setEditState({ name: '', description: '', icon: 'Dumbbell' });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Manage Habits</h1>
            <p className="text-sm text-muted-foreground">
              {sortedHabits.length} habits · {activeCount} active
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-2">
        {sortedHabits.map((habit, index) => {
          const IconComponent = getHabitIcon(habit.icon);
          const isEditing = editingId === habit.id;

          return (
            <div
              key={habit.id}
              className={`bg-card/30 rounded-card border border-border/50 overflow-hidden transition-opacity ${!habit.isActive ? 'opacity-50' : ''}`}
            >
              {/* Row */}
              <div className="flex items-center gap-3 p-3">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                  >
                    <ChevronUp size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    disabled={index === sortedHabits.length - 1}
                    onClick={() => handleMove(index, 'down')}
                  >
                    <ChevronDown size={14} />
                  </Button>
                </div>

                {/* Icon + Name (tappable to edit) */}
                <button
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                  onClick={() => isEditing ? cancelEdit() : startEdit(habit)}
                >
                  <IconComponent size={20} className="text-primary-neon shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{habit.name}</p>
                    {habit.description && (
                      <p className="text-xs text-muted-foreground truncate">{habit.description}</p>
                    )}
                  </div>
                </button>

                {/* Active toggle */}
                <Switch
                  checked={habit.isActive}
                  onCheckedChange={() => handleToggleActive(habit)}
                />
              </div>

              {/* Inline edit */}
              {isEditing && (
                <div className="border-t border-border/50 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <IconPicker selectedIcon={editState.icon} onSelect={(icon) => setEditState(s => ({ ...s, icon }))} />
                    <Input
                      value={editState.name}
                      onChange={(e) => setEditState(s => ({ ...s, name: e.target.value }))}
                      placeholder="Habit name"
                      className="flex-1"
                    />
                  </div>
                  <Input
                    value={editState.description}
                    onChange={(e) => setEditState(s => ({ ...s, description: e.target.value }))}
                    placeholder="Description (optional)"
                  />
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {habit.valueType === 'tiered' ? 'Tiered' : 'Boolean'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will not delete historical entries but the habit will be removed from your tracker.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(habit.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={updateHabit.isPending}>Save</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add new habit */}
        {isAdding ? (
          <div className="bg-card/30 rounded-card border border-primary/50 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <IconPicker selectedIcon={editState.icon} onSelect={(icon) => setEditState(s => ({ ...s, icon }))} />
              <Input
                value={editState.name}
                onChange={(e) => setEditState(s => ({ ...s, name: e.target.value }))}
                placeholder="New habit name"
                className="flex-1"
                autoFocus
              />
            </div>
            <Input
              value={editState.description}
              onChange={(e) => setEditState(s => ({ ...s, description: e.target.value }))}
              placeholder="Description (optional)"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={addHabit.isPending}>Add Habit</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={startAdd}>
            <Plus size={18} className="mr-2" /> Add Habit
          </Button>
        )}
      </div>
    </div>
  );
};
