import React, { useState } from 'react';
import { ChevronRight, Dumbbell, Edit3, Trash2, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkoutExercises } from '@/hooks/useWorkoutPlans';
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

export interface WorkoutPlan {
  id: string;
  day_number: number;
  day_name: string;
  created_at: string;
  updated_at: string;
}

interface DayPlanCardProps {
  workoutPlan: WorkoutPlan;
  onClick: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export const DayPlanCard: React.FC<DayPlanCardProps> = ({ workoutPlan, onClick, onRename, onDelete }) => {
  const { data: exercises } = useWorkoutExercises(workoutPlan.id);
  const exerciseCount = exercises?.length || 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(workoutPlan.day_name);

  const handleSaveRename = () => {
    if (editName.trim() && editName.trim() !== workoutPlan.day_name) {
      onRename(workoutPlan.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <Card className="bg-card/30 border-border/50 hover:bg-card/50 transition-colors">
      <div className="flex items-center p-4">
        {/* Main clickable area */}
        <button
          onClick={onClick}
          className="flex items-center flex-1 min-w-0 text-left"
        >
          <div className="bg-primary/20 rounded-lg p-2 mr-3">
            <Dumbbell size={20} className="text-primary-neon" />
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  onBlur={handleSaveRename}
                  className="h-7 text-sm"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <h3 className="font-semibold truncate">{workoutPlan.day_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {exerciseCount === 0 ? 'No exercises planned' :
                   exerciseCount === 1 ? '1 exercise' :
                   `${exerciseCount} exercises`}
                </p>
              </>
            )}
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setEditName(workoutPlan.day_name);
              setIsEditing(true);
            }}
          >
            <Edit3 size={14} className="text-muted-foreground" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 size={14} className="text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {workoutPlan.day_name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the day and all its exercises. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(workoutPlan.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <ChevronRight size={18} className="text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
};
