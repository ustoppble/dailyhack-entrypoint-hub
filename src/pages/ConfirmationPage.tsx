
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ConfirmationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If no user is authenticated, redirect to home
  React.useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Success!</CardTitle>
            <CardDescription className="text-center text-lg">
              Your DailyHack account is now connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Account Information</h3>
                <p className="text-sm text-blue-700">
                  Name: <span className="font-medium">{user.name}</span>
                </p>
                <p className="text-sm text-blue-700">
                  Email: <span className="font-medium">{user.email}</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Next Steps</h3>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Watch for our welcome email</p>
                    <p className="text-sm text-gray-600">
                      We'll send detailed instructions to your email address.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Complete your profile setup</p>
                    <p className="text-sm text-gray-600">
                      Add your company information and preferences.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Start using DailyHack features</p>
                    <p className="text-sm text-gray-600">
                      Explore your new marketing automation tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button onClick={() => navigate('/')}>
              Go to Homepage
            </Button>
            <Button variant="outline" onClick={() => window.open('https://dailyhack.com/documentation', '_blank')}>
              View Documentation
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmationPage;
