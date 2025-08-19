import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, QrCode, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  digital_id: string;
  full_name: string;
  role: 'admin' | 'employee' | 'student' | 'guest';
  access_level: 'full' | 'restricted' | 'visitor';
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

const DigitalId = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('tappass_users')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Error loading profile');
      } else {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!userProfile) return;

    const shareData = {
      title: 'TapPass Digital ID',
      text: `${userProfile.full_name}'s Digital ID`,
      url: `${window.location.origin}/verify/${userProfile.digital_id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Digital ID link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Error sharing digital ID');
    }
  };

  const generateQRData = () => {
    if (!userProfile) return '';
    return JSON.stringify({
      digitalId: userProfile.digital_id,
      name: userProfile.full_name,
      role: userProfile.role,
      accessLevel: userProfile.access_level,
      isActive: userProfile.is_active,
      timestamp: Date.now()
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Smartphone className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading Digital ID...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card>
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground">Profile not found</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">Digital ID</h1>
        </div>

        {/* Digital ID Card */}
        <Card className="mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center justify-between">
              <span>TapPass ID</span>
              <Smartphone className="w-6 h-6 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{userProfile.full_name}</h2>
                {userProfile.department && (
                  <p className="text-muted-foreground">{userProfile.department}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <Badge className={
                  userProfile.role === 'admin' ? 'bg-red-500' :
                  userProfile.role === 'employee' ? 'bg-blue-500' :
                  userProfile.role === 'student' ? 'bg-green-500' :
                  'bg-gray-500'
                }>
                  {userProfile.role.toUpperCase()}
                </Badge>
                <Badge className={
                  userProfile.access_level === 'full' ? 'bg-green-500' :
                  userProfile.access_level === 'restricted' ? 'bg-yellow-500' :
                  'bg-orange-500'
                }>
                  {userProfile.access_level.toUpperCase()}
                </Badge>
                <Badge className={userProfile.is_active ? 'bg-green-500' : 'bg-red-500'}>
                  {userProfile.is_active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Digital ID</p>
                <p className="font-mono text-sm break-all">{userProfile.digital_id}</p>
              </div>

              {userProfile.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p>{userProfile.phone}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Member since</p>
                <p>{new Date(userProfile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Placeholder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>QR Code</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <div className="w-48 h-48 bg-white border-2 border-dashed border-primary/30 mx-auto rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-primary/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">QR Code</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contains encrypted ID data
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              This QR code contains your encrypted digital ID for secure access verification
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={handleShare} className="w-full" size="lg">
            <Share2 className="w-5 h-5 mr-2" />
            Share Digital ID
          </Button>
          
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-medium mb-2">NFC Ready</h3>
            <p className="text-sm text-muted-foreground">
              Your device can be used as an NFC tag for contactless access. 
              Just tap your phone to compatible readers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalId;