import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-background text-foreground transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-auto ml-0 md:ml-64 lg:ml-72 transition-all duration-300 w-full bg-background/80 backdrop-blur">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
