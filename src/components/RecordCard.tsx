import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUpdateRecord } from '@/hooks/useWorkoutRecords';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
}

interface RecordCardProps {
  exercise: Exercise;
  workoutPlanId: string;
  existingRecord?: {
    current_weight: number;
    previous_best: number | null;
  };
}

export const RecordCard: React.FC<RecordCardProps> = ({ 
  exercise, 
  workoutPlanId, 
  existingRecord 
}) => {
  const [currentWeight, setCurrentWeight] = useState(
    existingRecord?.current_weight?.toString() || ''
  );
  const updateRecord = useUpdateRecord();
  const { toast } = useToast();

  const getUnit = (exerciseName: string) => {
    const name = exerciseName.toLowerCase();
    if (name.includes('ab roller') || 
        name.includes('goblet squat') || 
        name.includes('hip thrust') || 
        name.includes('hamstring curl') || 
        name.includes('dips') || 
        name.includes('pull-ups') || 
        name.includes('calf raises') ||
        name.includes('curls') ||
        name.includes('triceps') ||
        name.includes('inverted row') ||
        name.includes('split squat') ||
        name.includes('dead bug')) return 'reps';
    if (name.includes('side plank')) return 'seconds';
    return 'lbs';
  };

  const unit = getUnit(exercise.exercise_name);

  useEffect(() => {
    setCurrentWeight(existingRecord?.current_weight?.toString() || '');
  }, [existingRecord]);

  const handleWeightChange = (value: string) => {
    setCurrentWeight(value);
  };

  const getBenchPressBanner = () => {
    const benchPressImages = [
      "/lovable-uploads/b6e0b8fe-c00a-4d91-93f4-753135b6f95d.png",
      "/lovable-uploads/999fbb48-799b-4877-af1a-9822471ed042.png", 
      "/lovable-uploads/50c165cf-ec7a-4d96-9185-b9312448dec3.png"
    ];
    const randomIndex = Math.floor(Math.random() * benchPressImages.length);
    return benchPressImages[randomIndex];
  };

  const getInclineDBPressBanner = () => {
    const inclineDBPressImages = [
      "/lovable-uploads/21c871b7-76a2-46f8-9637-87c90a78739a.png",
      "/lovable-uploads/dc7d0c52-8f5e-4eb4-b290-95e75dba46ef.png",
      "/lovable-uploads/ec370f72-aa4e-4ee6-9c52-79ab2877d3ff.png"
    ];
    const randomIndex = Math.floor(Math.random() * inclineDBPressImages.length);
    return inclineDBPressImages[randomIndex];
  };

  const getOneArmDBRowBanner = () => {
    const oneArmDBRowImages = [
      "/lovable-uploads/d13e5963-8e05-42d5-8cdc-1c815de67c5d.png",
      "/lovable-uploads/dedef9b8-0f92-49a9-8255-ad03eeabe574.png",
      "/lovable-uploads/34e11708-30d0-4011-b0d5-df337d0ab9fc.png"
    ];
    const randomIndex = Math.floor(Math.random() * oneArmDBRowImages.length);
    return oneArmDBRowImages[randomIndex];
  };

  const getInvertedRowBanner = () => {
    const invertedRowImages = [
      "/lovable-uploads/8beea0e1-657b-4cc8-99ed-022125129bbf.png",
      "/lovable-uploads/2c69e7d5-b2e1-40ea-bf24-d9991d8a1ece.png",
      "/lovable-uploads/18894ec7-73de-4e3c-87a1-ec33d2f52757.png"
    ];
    const randomIndex = Math.floor(Math.random() * invertedRowImages.length);
    return invertedRowImages[randomIndex];
  };

  const getAbRollerBanner = () => {
    const abRollerImages = [
      "/lovable-uploads/13b17f87-9256-4a85-8825-cdfabe5c9a80.png",
      "/lovable-uploads/c3b552ca-3915-4dae-ac39-61469b1898cf.png",
      "/lovable-uploads/625b74da-fba8-409f-b6d4-765a7b2f3e0f.png"
    ];
    const randomIndex = Math.floor(Math.random() * abRollerImages.length);
    return abRollerImages[randomIndex];
  };

  const getSidePlankBanner = () => {
    const sidePlankImages = [
      "/lovable-uploads/dfedc3cc-7d75-4a94-9d1a-fa92b67fbb55.png",
      "/lovable-uploads/ccdbf395-803e-4d24-9080-813dc985f742.png",
      "/lovable-uploads/c081277d-fdc0-42b4-9da2-0a76ccb4af89.png"
    ];
    const randomIndex = Math.floor(Math.random() * sidePlankImages.length);
    return sidePlankImages[randomIndex];
  };

  const getDeadBugBanner = () => {
    const deadBugImages = [
      "/lovable-uploads/b4a303e9-65f6-4164-94aa-9efa874efa74.png",
      "/lovable-uploads/f5fa85a1-3b10-4f7a-922c-22ba8f270648.png",
      "/lovable-uploads/e9f1f3ba-ee63-4809-8c66-4de2426e5003.png"
    ];
    const randomIndex = Math.floor(Math.random() * deadBugImages.length);
    return deadBugImages[randomIndex];
  };

  const handleWeightSave = async () => {
    const weight = parseFloat(currentWeight);
    if (!weight || weight <= 0) return;

    try {
      await updateRecord.mutateAsync({
        workout_plan_id: workoutPlanId,
        exercise_name: exercise.exercise_name,
        current_weight: weight,
      });

      const isNewBest = !existingRecord?.previous_best || weight > existingRecord.previous_best;
      if (isNewBest) {
        const exerciseName = exercise.exercise_name.toLowerCase();
        const isBenchPress = exerciseName.includes('bench press');
        const isInclineDBPress = exerciseName.includes('incline db') || exerciseName.includes('incline dumbbell');
        const isOneArmDBRow = exerciseName.includes('1-arm db row') || exerciseName.includes('one arm db row') || exerciseName.includes('single arm db row');
        const isInvertedRow = exerciseName.includes('inverted row') || exerciseName.includes('inverted rows');
        const isAbRoller = exerciseName.includes('ab roller');
        const isSidePlank = exerciseName.includes('side plank');
        const isDeadBug = exerciseName.includes('dead bug');
        
        let bannerImage = "/lovable-uploads/439e1da3-3a9c-49f1-ae03-9da744442a15.png"; // default
        
        if (isBenchPress) {
          bannerImage = getBenchPressBanner();
        } else if (isInclineDBPress) {
          bannerImage = getInclineDBPressBanner();
        } else if (isOneArmDBRow) {
          bannerImage = getOneArmDBRowBanner();
        } else if (isInvertedRow) {
          bannerImage = getInvertedRowBanner();
        } else if (isAbRoller) {
          bannerImage = getAbRollerBanner();
        } else if (isSidePlank) {
          bannerImage = getSidePlankBanner();
        } else if (isDeadBug) {
          bannerImage = getDeadBugBanner();
        }
        
        toast({
          description: (
            <div className="flex items-center justify-center p-1 rounded-lg border-2 border-primary shadow-[0_0_20px_rgba(var(--primary),0.6)] bg-gradient-to-r from-primary/10 to-primary/5">
              <img 
                src={bannerImage}
                alt="New Personal Record Achieved" 
                className="max-w-full h-auto rounded-md"
              />
            </div>
          ),
        });
      } else {
        toast({
          title: "Record Updated",
          description: `${exercise.exercise_name}: ${weight} ${unit}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save record",
        variant: "destructive",
      });
    }
  };

  const handleBlur = () => {
    if (currentWeight && parseFloat(currentWeight) > 0) {
      handleWeightSave();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWeightSave();
    }
  };

  return (
    <Card className="bg-card/30 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-primary/20 rounded-lg p-2 mr-3">
              <Dumbbell size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{exercise.exercise_name}</h3>
              <p className="text-sm text-muted-foreground">
                {exercise.sets} sets × {exercise.reps} reps
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Previous Best
            </label>
            <div className="text-2xl font-bold">
              {existingRecord?.previous_best ? (
                <span className="text-green-500">
                  {existingRecord.previous_best} {unit}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 bg-background"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Current
            </label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={currentWeight}
              onChange={(e) => handleWeightChange(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className="text-lg font-semibold mt-1"
              min="0"
              step="0.5"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};