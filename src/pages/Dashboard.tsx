import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  IdCard, 
  Scan, 
  History, 
  Settings, 
  LogOut, 
  Smartphone, 
  Shield,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  digital_id: string;
  full_name: string;
  role: 'admin' | 'employee' | 'student' | 'guest';
  access_level: 'full' | 'restricted' | 'visitor';
  department?: string;
  is_active: boolean;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      
      // Fetch user profile
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
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'employee': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      case 'guest': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'full': return 'bg-green-500';
      case 'restricted': return 'bg-yellow-500';
      case 'visitor': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Smartphone className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading TapPass ID...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-4 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">TapPass ID</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* User Profile Card */}
        {userProfile && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{userProfile.full_name}</CardTitle>
                <Shield className={`w-6 h-6 ${userProfile.is_active ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <CardDescription>Digital ID: {userProfile.digital_id.slice(0, 8)}...</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex space-x-2">
                <Badge className={getRoleColor(userProfile.role)}>
                  {userProfile.role.toUpperCase()}
                </Badge>
                <Badge className={getAccessLevelColor(userProfile.access_level)}>
                  {userProfile.access_level.toUpperCase()}
                </Badge>
              </div>
              {userProfile.department && (
                <p className="text-sm text-muted-foreground mt-2">
                  {userProfile.department}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation Cards */}
        <div className="space-y-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/digital-id')}
          >
            <CardContent className="flex items-center space-x-4 p-4">
              <IdCard className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">My Digital ID</h3>
                <p className="text-sm text-muted-foreground">View and share your ID</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/scanner')}
          >
            <CardContent className="flex items-center space-x-4 p-4">
              <Scan className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">NFC Scanner</h3>
                <p className="text-sm text-muted-foreground">Scan and validate IDs</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/access-logs')}
          >
            <CardContent className="flex items-center space-x-4 p-4">
              <History className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Access History</h3>
                <p className="text-sm text-muted-foreground">View access logs</p>
              </div>
            </CardContent>
          </Card>

          {userProfile?.role === 'admin' && (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/admin')}
            >
              <CardContent className="flex items-center space-x-4 p-4">
                <Users className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="font-semibold">Admin Panel</h3>
                  <p className="text-sm text-muted-foreground">Manage users and access</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/settings')}
          >
            <CardContent className="flex items-center space-x-4 p-4">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Settings</h3>
                <p className="text-sm text-muted-foreground">App preferences</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;