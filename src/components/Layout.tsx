
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-700">DailyHack</Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-blue-700">Home</Link>
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="text-gray-600 hover:text-blue-700">Register</Link>
                <Link to="/agents" className="text-gray-600 hover:text-blue-700">Agents</Link>
              </>
            ) : (
              <>
                <Link to="/agents" className="text-gray-600 hover:text-blue-700">Agents</Link>
              </>
            )}
          </nav>
          
          <div>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="hidden md:inline text-sm text-gray-600">Hello, {user?.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link to="/register">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">DailyHack</h3>
              <p className="text-gray-300 text-sm">Marketing automation made simple</p>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-300 hover:text-white">Terms</a>
              <a href="#" className="text-gray-300 hover:text-white">Privacy</a>
              <a href="#" className="text-gray-300 hover:text-white">Contact</a>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} DailyHack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
