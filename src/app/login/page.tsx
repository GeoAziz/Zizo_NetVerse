
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Fingerprint, ShieldKeyhole, Bot, Eye, LogIn, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic validation (in a real app, this would be more robust)
    if (!email || !password) {
      toast({
        title: "Authentication Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Simulate successful login
    toast({
      title: "Authentication Successful",
      description: `Welcome back, Agent. Redirecting to Mission Control...`,
      variant: "default",
    });

    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
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
        {/* Placeholder for more complex background like Three.js grid or particles */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      </motion.div>

      <motion.div
        custom={0}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center text-4xl md:text-5xl font-bold text-primary mb-8"
      >
        <ShieldKeyhole className="h-10 w-10 mr-3 text-accent animate-pulse" />
        {APP_NAME}
      </motion.div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <Card className="w-full max-w-md shadow-2xl border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <motion.div custom={1} variants={itemVariants}>
              <CardTitle className="text-2xl text-accent">Agent Authentication Required</CardTitle>
            </motion.div>
            <motion.div custom={2} variants={itemVariants}>
              <CardDescription>Secure access to Zizo_NetVerse command deck.</CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <motion.div custom={3} variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground flex items-center">
                  <UserCircle className="mr-2 h-4 w-4" /> Agent ID / Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent.id@zizonetverse.ops"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input/70 border-border focus:ring-accent placeholder:text-muted-foreground/70"
                />
              </motion.div>
              <motion.div custom={4} variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground flex items-center">
                  <ShieldKeyhole className="mr-2 h-4 w-4" /> Access Code / Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input/70 border-border focus:ring-accent placeholder:text-muted-foreground/70"
                />
              </motion.div>
              <motion.div custom={5} variants={itemVariants}>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2 h-4 w-4"
                      >
                        <Bot />
                      </motion.div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Authorize & Engage
                    </>
                  )}
                </Button>
              </motion.div>
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
              Unauthorized access is strictly monitored and logged.
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
