import React from 'react';
import { Link } from 'react-router-dom';

const PageNotFound = () => {
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-9xl font-bold text-slate-800">404</h1>
      <h2 className="text-2xl font-semibold text-white mt-4">Page Not Found</h2>
      <p className="text-slate-400 mt-2 max-w-sm">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
      <Link to="/" className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20">
        Go Back Home
      </Link>
    </div>
  );
};

export default PageNotFound;
