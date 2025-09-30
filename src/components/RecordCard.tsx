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
  rep_type: 'fixed' | 'amrap';
}

interface RecordCardProps {
  exercise: Exercise;
  workoutPlanId: string;
  existingRecord?: {
    current_weight: number;
    previous_best: number | null;
    actual_reps: number | null;
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
  const [actualReps, setActualReps] = useState(
    existingRecord?.actual_reps?.toString() || ''
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
        name.includes('dead bug') ||
        name.includes('1-arm db row') ||
        name.includes('one arm db row') ||
        name.includes('single arm db row') ||
        name.includes('incline db') ||
        name.includes('incline dumbbell')) return 'reps';
    if (name.includes('side plank')) return 'seconds';
    return 'lbs';
  };

  const unit = getUnit(exercise.exercise_name);

  // Benchmark data for exercises
  const getBenchmarkData = (exerciseName: string): number[] => {
    const name = exerciseName.toLowerCase();
    
    // Skip benchmark circles for Fun and Active Recovery exercises
    if (name.includes('fun') || name.includes('active recovery')) {
      return [];
    }
    
    if (name.includes('ab roller')) {
      return [0, 1, 3, 6, 10, 15, 20, 25, 50, 100];
    }
    if (name.includes('side plank')) {
      return [15, 20, 30, 45, 75, 105, 135, 180, 240, 300];
    }
    if (name.includes('dead bug')) {
      return [4, 8, 10, 12, 15, 20, 25, 30, 40, 50];
    }
    if (name.includes('deadlift')) {
      return [95, 135, 185, 225, 275, 315, 365, 405, 455, 495];
    }
    if (name.includes('goblet squat')) {
      return [3, 6, 10, 15, 20, 25, 30, 35, 40, 50];
    }
    if (name.includes('hip thrust')) {
      return [0, 95, 135, 185, 225, 275, 315, 365, 405, 455];
    }
    if (name.includes('hamstring curl')) {
      return [1, 2, 4, 6, 10, 14, 18, 25, 30, 40];
    }
    if (name.includes('back squat')) {
      return [45, 95, 135, 185, 225, 275, 315, 365, 405, 455];
    }
    if (name.includes('romanian deadlift')) {
      return [65, 95, 135, 185, 225, 275, 315, 365, 405, 455];
    }
    if (name.includes('split squat')) {
      return [5, 8, 10, 12, 15, 20, 25, 30, 40, 50];
    }
    if (name.includes('calf raises')) {
      return [5, 10, 15, 20, 25, 35, 50, 75, 100, 150];
    }
    if (name.includes('bench press')) {
      return [65, 95, 135, 165, 185, 205, 225, 245, 275, 315];
    }
    if (name.includes('1-arm db row') || name.includes('one arm db row') || name.includes('single arm db row')) {
      return [3, 5, 8, 10, 12, 15, 18, 20, 25, 30];
    }
    if (name.includes('incline db') || name.includes('incline dumbbell')) {
      return [1, 2, 4, 6, 8, 10, 12, 15, 18, 20];
    }
    if (name.includes('inverted row')) {
      return [0, 2, 4, 5, 8, 12, 15, 20, 25, 30];
    }
    if (name.includes('ohp') || name.includes('overhead press')) {
      return [45, 65, 85, 95, 115, 135, 155, 175, 185, 205];
    }
    if (name.includes('pull-ups') || name.includes('pullups')) {
      return [0, 1, 3, 5, 8, 10, 12, 15, 20, 25];
    }
    if (name.includes('dips')) {
      return [0, 2, 4, 6, 10, 15, 20, 25, 30, 40];
    }
    if (name.includes('dumbbell curls') || name.includes('db curls')) {
      return [2, 4, 6, 8, 10, 12, 15, 18, 20, 25];
    }
    if (name.includes('triceps extensions') || name.includes('db triceps')) {
      return [3, 5, 7, 9, 12, 15, 18, 20, 25, 30];
    }
    // Default empty array for exercises without benchmarks
    return [];
  };

  // Calculate color gradient from light blue to bright pink
  const getCircleStyle = (index: number, isAchieved: boolean): React.CSSProperties => {
    if (!isAchieved) return {};
    
    // HSL gradient: light blue (200, 70%, 80%) to bright pink (320, 90%, 60%)
    const hue = 200 + (index * (320 - 200) / 9); // Interpolate hue
    const saturation = 70 + (index * (90 - 70) / 9); // Interpolate saturation
    const lightness = 80 - (index * (80 - 60) / 9); // Interpolate lightness
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    return {
      borderColor: color,
      backgroundColor: color,
    };
  };

  // Calculate achieved level based on current PR
  const calculateAchievedLevel = (exerciseName: string, currentPR: number | null): number => {
    if (!currentPR) return -1;
    
    const benchmarks = getBenchmarkData(exerciseName);
    if (benchmarks.length === 0) return -1;
    
    let achievedLevel = -1;
    for (let i = 0; i < benchmarks.length; i++) {
      if (currentPR >= benchmarks[i]) {
        achievedLevel = i;
      }
    }
    return achievedLevel;
  };

  const benchmarkData = getBenchmarkData(exercise.exercise_name);
  const achievedLevel = calculateAchievedLevel(exercise.exercise_name, existingRecord?.previous_best || null);

  useEffect(() => {
    setCurrentWeight(existingRecord?.current_weight?.toString() || '');
    setActualReps(existingRecord?.actual_reps?.toString() || '');
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

  const getOHPBanner = () => {
    const ohpImages = [
      "/lovable-uploads/ohp-banner-1.png",
      "/lovable-uploads/ohp-banner-2.png",
      "/lovable-uploads/ohp-banner-3.png"
    ];
    const randomIndex = Math.floor(Math.random() * ohpImages.length);
    return ohpImages[randomIndex];
  };

  const getPullUpBanner = () => {
    const pullUpImages = [
      "/lovable-uploads/pullup-banner-1.png",
      "/lovable-uploads/pullup-banner-2.png",
      "/lovable-uploads/pullup-banner-3.png"
    ];
    const randomIndex = Math.floor(Math.random() * pullUpImages.length);
    return pullUpImages[randomIndex];
  };

  const getCurlsBanner = () => {
    const curlsImages = [
      "/lovable-uploads/curls-banner-1.png",
      "/lovable-uploads/curls-banner-2.png",
      "/lovable-uploads/curls-banner-3.png"
    ];
    const randomIndex = Math.floor(Math.random() * curlsImages.length);
    return curlsImages[randomIndex];
  };

  const getDipsBanner = () => {
    const dipsImages = [
      "/lovable-uploads/dips-banner-1.png",
      "/lovable-uploads/dips-banner-2.png",
      "/lovable-uploads/dips-banner-3.png"
    ];
    const randomIndex = Math.floor(Math.random() * dipsImages.length);
    return dipsImages[randomIndex];
  };

  const getTricepExtensionsBanner = () => {
    const tricepsImages = [
      "/lovable-uploads/triceps-banner-1.png",
      "/lovable-uploads/triceps-banner-2.png",
      "/lovable-uploads/triceps-banner-3.png"
    ];
    const randomIndex = Math.floor(Math.random() * tricepsImages.length);
    return tricepsImages[randomIndex];
  };

  const getBackSquatBanner = () => {
    const backSquatImages = [
      "/lovable-uploads/backsquat-banner-1.png",
      "/lovable-uploads/backsquat-banner-2.png",
      "/lovable-uploads/backsquat-banner-3.png"
    ];
    const randomIndex = Math.floor(Math.random() * backSquatImages.length);
    return backSquatImages[randomIndex];
  };

  const getCalfRaisesBanner = () => {
    const calfRaisesImages = [
      "/lovable-uploads/calfraises-banner-1.png",
      "/lovable-uploads/calfraises-banner-2.png",
      "/lovable-uploads/calfraises-banner-3.png"
    ];
    const randomIndex = Math.floor(Math.random() * calfRaisesImages.length);
    return calfRaisesImages[randomIndex];
  };

  const handleWeightSave = async () => {
    const weight = parseFloat(currentWeight);
    if (!weight || weight <= 0) return;

    const reps = exercise.rep_type === 'amrap' ? parseInt(actualReps) : undefined;
    if (exercise.rep_type === 'amrap' && (!reps || reps <= 0)) {
      toast({
        title: "Error",
        description: "Please enter the reps achieved",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateRecord.mutateAsync({
        workout_plan_id: workoutPlanId,
        exercise_name: exercise.exercise_name,
        current_weight: weight,
        actual_reps: reps,
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
        const isOHP = exerciseName.includes('ohp') || exerciseName.includes('overhead press');
        const isPullUp = exerciseName.includes('pull-ups') || exerciseName.includes('pullups');
        const isCurls = exerciseName.includes('curls');
        const isDips = exerciseName.includes('dips');
        const isTricepExtensions = exerciseName.includes('triceps extensions') || exerciseName.includes('db triceps');
        const isBackSquat = exerciseName.includes('back squat');
        const isCalfRaises = exerciseName.includes('calf raises');
        
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
        } else if (isOHP) {
          bannerImage = getOHPBanner();
        } else if (isPullUp) {
          bannerImage = getPullUpBanner();
        } else if (isCurls) {
          bannerImage = getCurlsBanner();
        } else if (isDips) {
          bannerImage = getDipsBanner();
        } else if (isTricepExtensions) {
          bannerImage = getTricepExtensionsBanner();
        } else if (isBackSquat) {
          bannerImage = getBackSquatBanner();
        } else if (isCalfRaises) {
          bannerImage = getCalfRaisesBanner();
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
      // For AMRAP exercises, ensure reps are also entered before saving
      if (exercise.rep_type === 'amrap') {
        const repsValue = parseInt(actualReps);
        if (!actualReps || isNaN(repsValue) || repsValue <= 0) {
          return; // Don't save yet, wait for reps to be entered
        }
      }
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
                {exercise.rep_type === 'amrap' 
                  ? `${exercise.sets} sets × AMRAP ${exercise.reps}+`
                  : `${exercise.sets} sets × ${exercise.reps} reps`}
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
              {benchmarkData.length > 0 && !exercise.exercise_name.toLowerCase().includes('fun') && !exercise.exercise_name.toLowerCase().includes('active recovery') ? (
                // Show benchmark circles for exercises with data
                benchmarkData.map((benchmark, index) => {
                  const isAchieved = index <= achievedLevel;
                  const isSpecial5 = index === 4 && isAchieved; // 5th circle (index 4)
                  const isSpecial8 = index === 7 && isAchieved; // 8th circle (index 7)
                  
                  return (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                        isAchieved 
                          ? '' 
                          : 'border-muted-foreground/30 bg-background'
                      } ${
                        isSpecial5 ? 'shadow-[0_0_8px_rgba(255,255,255,0.5)] scale-110' : ''
                      } ${
                        isSpecial8 ? 'shadow-[0_0_12px_hsl(320,90%,60%)] scale-125 animate-pulse' : ''
                      }`}
                      style={getCircleStyle(index, isAchieved)}
                      title={`Level ${index + 1}: ${benchmark} ${unit}${isAchieved ? ' ✓' : ''}`}
                    />
                  );
                })
              ) : benchmarkData.length === 0 && !exercise.exercise_name.toLowerCase().includes('fun') && !exercise.exercise_name.toLowerCase().includes('active recovery') ? (
                // Show empty circles for exercises without benchmark data (but not Fun or Active Recovery)
                Array.from({ length: 10 }, (_, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 bg-background"
                  />
                ))
              ) : null}
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

        {exercise.rep_type === 'amrap' && (
          <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground">
              Reps Achieved
            </label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={actualReps}
              onChange={(e) => setActualReps(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className="text-lg font-semibold mt-1"
              min="0"
              step="1"
            />
            {existingRecord?.actual_reps && (
              <p className="text-xs text-muted-foreground mt-1">
                Previous: {existingRecord.actual_reps} reps
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};