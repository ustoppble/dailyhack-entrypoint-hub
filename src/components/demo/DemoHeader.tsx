
import React from 'react';
import { Link } from 'react-router-dom';

const DemoHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <Link to="/" className="text-2xl font-bold text-blue-700">
          DailyHack
        </Link>
      </div>
    </header>
  );
};

export default DemoHeader;
