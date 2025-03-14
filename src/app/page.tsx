'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Route } from 'next';
import SparkMascot from '../components/SparkMascot';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login page
    router.replace('/auth/login' as Route);
  }, [router]);

  // Return a minimal loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-16 h-16 border-t-4 border-b-4 border-[#3ab8fe] rounded-full animate-spin"></div>
      <SparkMascot 
        width={150} 
        height={150} 
        variant="blue" 
        blinking={true}  // Can keep blinking enabled on landing page
        isTeacherContext={false} // Set to false on landing page
      />
    </div>
  );
}
