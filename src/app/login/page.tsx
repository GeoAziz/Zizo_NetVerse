
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Fingerprint, Shield, Bot, Eye, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Authentication Successful",
        description: `Welcome, Agent. Redirecting to Mission Control...`,
        variant: "default",
      });
      router.push('/dashboard');
    } catch (error: any) {
      const errorCode = error.code || 'unknown-error';
      let errorMessage = "An unexpected error occurred.";
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please check your Agent ID and Access Code.";
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = "The provided Agent ID is not a valid email format.";
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.6, ease: "circOut" } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
    }),
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-indigo-900/30 p-4">
      <motion.div
        className="absolute inset-0 -z-10 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      </motion.div>

      <motion.div
        custom={0}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center text-4xl md:text-5xl font-bold text-primary mb-8"
      >
        <Shield className="h-10 w-10 mr-3 text-accent animate-pulse" />
        {APP_NAME}
      </motion.div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <Card className="shadow-2xl border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-accent">Agent Authentication</CardTitle>
              <CardDescription>Secure access to {APP_NAME} command deck.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-login" className="text-muted-foreground flex items-center">
                     Agent ID / Email
                  </Label>
                  <Input id="email-login" type="email" placeholder="agent.id@zizonetverse.ops" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input/70 border-border focus:ring-accent placeholder:text-muted-foreground/70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login" className="text-muted-foreground flex items-center">
                     Access Code / Password
                  </Label>
                  <Input id="password-login" type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input/70 border-border focus:ring-accent placeholder:text-muted-foreground/70" />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Authenticating...</> : <><LogIn className="mr-2 h-4 w-4"/> Authorize & Engage</>}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col items-center space-y-4 pt-6">
              <motion.p custom={6} variants={itemVariants} className="text-xs text-muted-foreground text-center">
                Alternative authentication methods:
              </motion.p>
              <motion.div custom={7} variants={itemVariants} className="flex space-x-3">
                <Button variant="outline" size="sm" className="text-muted-foreground border-border/50 hover:border-accent hover:text-accent" onClick={() => toast({ title: "Feature Pending", description: "Retina scan authentication coming soon."})}>
                  <Eye className="mr-2 h-4 w-4" /> Retina Scan
                </Button>
                <Button variant="outline" size="sm" className="text-muted-foreground border-border/50 hover:border-accent hover:text-accent" onClick={() => toast({ title: "Feature Pending", description: "Biometric/PIN authentication coming soon."})}>
                  <Fingerprint className="mr-2 h-4 w-4" /> Biometric/PIN
                </Button>
              </motion.div>
              <motion.p custom={8} variants={itemVariants} className="text-xs text-muted-foreground/70 pt-4 text-center">
                Access is restricted to authorized personnel. Unauthorized access is strictly monitored and logged.
              </motion.p>
            </CardFooter>
        </Card>
      </motion.div>
       <motion.div
        custom={9}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="absolute bottom-4 text-xs text-muted-foreground/60 text-center"
      >
        &copy; {new Date().getFullYear()} {APP_NAME}. All Rights Reserved. Cyber Operations Division.
      </motion.div>
    </div>
  );
}
