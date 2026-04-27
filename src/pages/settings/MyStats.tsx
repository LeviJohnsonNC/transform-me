import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserStats, useUpsertUserStats } from '@/hooks/useUserStats';
import type { Gender } from '@/lib/strengthStandards';
import { toast } from 'sonner';

interface MyStatsProps {
  onBack: () => void;
}

export const MyStats: React.FC<MyStatsProps> = ({ onBack }) => {
  const { data: stats, isLoading } = useUserStats();
  const upsert = useUpsertUserStats();

  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [bodyweight, setBodyweight] = useState('');

  useEffect(() => {
    if (stats) {
      setGender(stats.gender);
      setAge(String(stats.age));
      setBodyweight(String(stats.bodyweight_lbs));
    }
  }, [stats]);

  const handleSave = async () => {
    const ageNum = parseInt(age);
    const bwNum = parseFloat(bodyweight);
    if (!ageNum || ageNum < 10 || ageNum > 100) {
      toast.error('Age must be between 10 and 100');
      return;
    }
    if (!bwNum || bwNum < 50 || bwNum > 600) {
      toast.error('Bodyweight must be between 50 and 600 lbs');
      return;
    }
    try {
      await upsert.mutateAsync({ gender, age: ageNum, bodyweight_lbs: bwNum });
      toast.success('Stats saved');
    } catch (e) {
      toast.error('Failed to save stats');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">My Stats</h1>
            <p className="text-sm text-muted-foreground">Used to score your lifts on a 1–10 scale</p>
          </div>
          <Activity className="text-primary" size={24} />
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        <div className="bg-card/30 rounded-card p-6 space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Strength standards differ by sex. "Prefer not to say" uses male standards.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label>Bodyweight (lbs)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={50}
                  max={600}
                  step={0.5}
                  value={bodyweight}
                  onChange={(e) => setBodyweight(e.target.value)}
                  placeholder="180"
                />
              </div>

              <Button onClick={handleSave} disabled={upsert.isPending} className="w-full">
                {upsert.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Save Stats
              </Button>
            </>
          )}
        </div>

        <div className="bg-card/20 rounded-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How ratings work</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>1</strong> – bare minimum, attainable with no training</li>
            <li><strong>5</strong> – a reasonably fit person</li>
            <li><strong>10</strong> – hard but drug-free attainable</li>
          </ul>
          <p className="mt-2">For weighted lifts we estimate your 1-rep max from weight × reps (Epley formula), so 150×10 counts more than 150×1.</p>
        </div>
      </div>
    </div>
  );
};
