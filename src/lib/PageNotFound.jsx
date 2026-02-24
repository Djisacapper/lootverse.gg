import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Box, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-[#0e0e18] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
          <Box className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-black text-white mb-3">404</h1>
        <p className="text-white/40 mb-8">Page not found</p>
        <Link to={createPageUrl('Home')}>
          <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl">
            <Home className="w-4 h-4 mr-2" /> Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}