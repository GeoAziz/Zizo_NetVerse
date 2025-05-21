
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react'; // Or any other loading icon you prefer

export default function SplashScreenPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000); // 5 seconds

    return () => clearTimeout(timer); // Cleanup the timer
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-primary mb-4">
          Zizo_NetVerse
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl md:text-2xl text-muted-foreground mb-8"
        >
          Initializing Mainframe Sequencers...
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex items-center justify-center space-x-3"
        >
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-lg text-accent">System Booting... Please Stand By.</span>
        </motion.div>
      </motion.div>
      
      <motion.div
        className="absolute bottom-8 text-xs text-muted-foreground/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1.5 }}
      >
        <p>&copy; {new Date().getFullYear()} Zizo_NetVerse. All rights reserved.</p>
        <p>DevMahnXAI & Zizo Collaboration</p>
      </motion.div>
    </div>
  );
}
