import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Shield, Users, Scan } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-12 h-12 text-primary" />
              <Shield className="w-12 h-12 text-secondary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">TapPass ID</CardTitle>
          <CardDescription className="text-lg">
            Secure Digital Access System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">
              Experience the future of access control with NFC-enabled digital IDs
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">User Management</p>
            </div>
            <div className="text-center p-3 bg-secondary/5 rounded-lg">
              <Scan className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-sm font-medium">NFC Scanning</p>
            </div>
          </div>

          <Button 
            onClick={() => navigate('/auth')} 
            className="w-full" 
            size="lg"
          >
            Get Started
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Secure • Fast • Contactless</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
