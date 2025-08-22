import { useEffect, useState } from 'react';
import { useMigrateLocalData } from '@/hooks/useHabits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Upload } from 'lucide-react';

export const DataMigration = () => {
  const [hasLocalData, setHasLocalData] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const migrateData = useMigrateLocalData();

  useEffect(() => {
    // Check if there's local data to migrate
    const localData = localStorage.getItem('transform-habits');
    if (localData) {
      const parsedData = JSON.parse(localData);
      const entries = parsedData.state?.entries || [];
      setHasLocalData(entries.length > 0);
    }
  }, []);

  const handleMigration = async () => {
    try {
      const result = await migrateData.mutateAsync();
      if (result.migrated > 0) {
        setMigrationComplete(true);
        setHasLocalData(false);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  if (migrationComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Migration Complete
          </CardTitle>
          <CardDescription className="text-green-700">
            Your habit data has been successfully migrated to the cloud and will now sync across all your devices.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!hasLocalData) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Local Data Found
        </CardTitle>
        <CardDescription className="text-orange-700">
          We found habit data stored locally on this device. Would you like to migrate it to the cloud for cross-device sync?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleMigration}
          disabled={migrateData.isPending}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          {migrateData.isPending ? 'Migrating...' : 'Migrate to Cloud'}
        </Button>
      </CardContent>
    </Card>
  );
};