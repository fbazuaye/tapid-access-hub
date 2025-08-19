import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Scan, CheckCircle, XCircle, Smartphone, Waves } from 'lucide-react';
import { toast } from 'sonner';

interface ScannedUser {
  digital_id: string;
  full_name: string;
  role: 'admin' | 'employee' | 'student' | 'guest';
  access_level: 'full' | 'restricted' | 'visitor';
  department?: string;
  is_active: boolean;
}

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [manualId, setManualId] = useState('');
  const [accessReason, setAccessReason] = useState('');
  const [location, setLocation] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setCurrentUser(session.user);
  };

  const validateAccess = (user: ScannedUser): { granted: boolean; reason: string } => {
    if (!user.is_active) {
      return { granted: false, reason: 'User account is inactive' };
    }

    const now = new Date();
    const hour = now.getHours();

    // Basic access control logic
    switch (user.access_level) {
      case 'full':
        return { granted: true, reason: 'Full access granted' };
      
      case 'restricted':
        // Restricted access during business hours only (8 AM - 6 PM)
        if (hour >= 8 && hour < 18) {
          return { granted: true, reason: 'Restricted access granted during business hours' };
        } else {
          return { granted: false, reason: 'Access denied outside business hours' };
        }
      
      case 'visitor':
        // Visitors only during business hours with escort
        if (hour >= 9 && hour < 17) {
          return { granted: true, reason: 'Visitor access granted - escort required' };
        } else {
          return { granted: false, reason: 'Visitor access denied outside visiting hours' };
        }
      
      default:
        return { granted: false, reason: 'Invalid access level' };
    }
  };

  const handleNFCScan = async () => {
    setIsScanning(true);
    
    // Simulate NFC scanning
    setTimeout(() => {
      setIsScanning(false);
      toast.info('Place your device near the NFC tag or enter Digital ID manually');
    }, 2000);
  };

  const handleManualLookup = async () => {
    if (!manualId.trim()) {
      toast.error('Please enter a Digital ID');
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from('tappass_users')
        .select('*')
        .eq('digital_id', manualId.trim())
        .single();

      if (error || !user) {
        toast.error('Digital ID not found');
        return;
      }

      setScannedUser(user);
    } catch (error) {
      console.error('Error looking up user:', error);
      toast.error('Error looking up Digital ID');
    }
  };

  const logAccess = async (user: ScannedUser, granted: boolean, reason: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('access_logs')
        .insert({
          digital_id: user.digital_id,
          reader_user_id: currentUser.id,
          access_granted: granted,
          access_reason: reason,
          location: location.trim() || 'Unknown location'
        });

      if (error) {
        console.error('Error logging access:', error);
        toast.error('Error logging access attempt');
      }
    } catch (error) {
      console.error('Error logging access:', error);
    }
  };

  const handleGrantAccess = async () => {
    if (!scannedUser) return;

    const validation = validateAccess(scannedUser);
    const finalReason = accessReason.trim() || validation.reason;

    await logAccess(scannedUser, validation.granted, finalReason);

    if (validation.granted) {
      toast.success(`Access granted to ${scannedUser.full_name}`);
    } else {
      toast.error(`Access denied: ${validation.reason}`);
    }

    // Reset form
    setScannedUser(null);
    setManualId('');
    setAccessReason('');
  };

  const handleDenyAccess = async () => {
    if (!scannedUser) return;

    const reason = accessReason.trim() || 'Access manually denied by reader';
    await logAccess(scannedUser, false, reason);
    
    toast.error(`Access denied to ${scannedUser.full_name}`);
    
    // Reset form
    setScannedUser(null);
    setManualId('');
    setAccessReason('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-4 max-w-md">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">NFC Scanner</h1>
        </div>

        {/* Location Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Scanner Location</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Main Entrance, Office Building A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* NFC Scanning */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Waves className="w-5 h-5" />
              <span>NFC Scanning</span>
            </CardTitle>
            <CardDescription>
              Scan an NFC-enabled device or enter Digital ID manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleNFCScan} 
              className="w-full" 
              size="lg"
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Smartphone className="w-5 h-5 mr-2 animate-pulse" />
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5 mr-2" />
                  Start NFC Scan
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or enter manually
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-id">Digital ID</Label>
              <div className="flex space-x-2">
                <Input
                  id="manual-id"
                  placeholder="Enter Digital ID"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                />
                <Button onClick={handleManualLookup}>
                  Lookup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanned User */}
        {scannedUser && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Scanned User</span>
                {scannedUser.is_active ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{scannedUser.full_name}</h3>
                {scannedUser.department && (
                  <p className="text-muted-foreground">{scannedUser.department}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <Badge className={
                  scannedUser.role === 'admin' ? 'bg-red-500' :
                  scannedUser.role === 'employee' ? 'bg-blue-500' :
                  scannedUser.role === 'student' ? 'bg-green-500' :
                  'bg-gray-500'
                }>
                  {scannedUser.role.toUpperCase()}
                </Badge>
                <Badge className={
                  scannedUser.access_level === 'full' ? 'bg-green-500' :
                  scannedUser.access_level === 'restricted' ? 'bg-yellow-500' :
                  'bg-orange-500'
                }>
                  {scannedUser.access_level.toUpperCase()}
                </Badge>
                <Badge className={scannedUser.is_active ? 'bg-green-500' : 'bg-red-500'}>
                  {scannedUser.is_active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-reason">Access Reason (Optional)</Label>
                <Textarea
                  id="access-reason"
                  placeholder="Enter reason for access or additional notes..."
                  value={accessReason}
                  onChange={(e) => setAccessReason(e.target.value)}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleGrantAccess} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Grant Access
                </Button>
                <Button 
                  onClick={handleDenyAccess} 
                  variant="destructive" 
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny Access
                </Button>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Access Validation</p>
                <p className="text-sm text-muted-foreground">
                  {validateAccess(scannedUser).reason}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">How to use NFC Scanner</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tap "Start NFC Scan" and hold devices close together</li>
              <li>• Or manually enter the Digital ID to lookup users</li>
              <li>• Review user details and access permissions</li>
              <li>• Grant or deny access based on validation rules</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Scanner;