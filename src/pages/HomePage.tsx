
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">Welcome to DailyHack</h1>
        <p className="text-xl text-gray-600 mb-8">
          Streamline your business operations with our automated marketing and analytics solutions.
        </p>
        
        {!isAuthenticated ? (
          <div className="grid gap-6 md:grid-cols-2 mt-12">
            <Card>
              <CardHeader>
                <CardTitle>New to DailyHack?</CardTitle>
                <CardDescription>Create your account and get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Register for free and connect your ActiveCampaign account to unlock
                  powerful marketing automation tools.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/register">Register Now</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Already registered?</CardTitle>
                <CardDescription>Log in to your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  If you already have an account, log in to access your dashboard
                  and marketing tools.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Log In</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user?.name}!</CardTitle>
              <CardDescription>Your DailyHack account is ready.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Continue setting up your integration or view your dashboard.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button asChild>
                <Link to="/integrate">Integrate ActiveCampaign</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
        
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Automated Marketing</h3>
            <p className="text-gray-600">
              Streamline your marketing efforts with powerful automation tools.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Customer Analytics</h3>
            <p className="text-gray-600">
              Gain deeper insights into customer behavior and engagement.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Seamless Integration</h3>
            <p className="text-gray-600">
              Connect with your existing ActiveCampaign account in minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
