
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Fingerprint, Shield, Bot, Eye, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signup, login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthAction = async (action: 'login' | 'signup') => {
    setIsLoading(true);
    try {
      if (action === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      toast({
        title: "Authentication Successful",
        description: `Welcome, Agent. Redirecting to Mission Control...`,
        variant: "default",
      });
      router.push('/dashboard');
    } catch (error: any) {
      const errorCode = error.code || 'unknown-error';
      let errorMessage = "An unexpected error occurred.";
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        errorMessage = "Invalid credentials. Please check your Agent ID and Access Code.";
      } else if (errorCode === 'auth/email-already-in-use') {
        errorMessage = "An agent with this ID is already registered.";
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = "Access Code is too weak. It should be at least 6 characters.";
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

      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <Tabs defaultValue="login" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login"><LogIn className="mr-2 h-4 w-4"/>Log In</TabsTrigger>
            <TabsTrigger value="signup"><UserPlus className="mr-2 h-4 w-4"/>Sign Up</TabsTrigger>
          </TabsList>
          
          <Card className="shadow-2xl border-primary/30 bg-card/80 backdrop-blur-sm rounded-t-none">
            <TabsContent value="login">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-accent">Agent Authentication</CardTitle>
                <CardDescription>Secure access to {APP_NAME} command deck.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('login'); }} className="space-y-6">
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
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-accent">New Agent Registration</CardTitle>
                <CardDescription>Create your secure access credentials.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signup'); }} className="space-y-6">
                   <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-muted-foreground flex items-center">
                       Agent ID / Email
                    </Label>
                    <Input id="email-signup" type="email" placeholder="agent.id@zizonetverse.ops" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input/70 border-border focus:ring-accent placeholder:text-muted-foreground/70" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-muted-foreground flex items-center">
                      Access Code / Password
                    </Label>
                    <Input id="password-signup" type="password" placeholder="Choose a secure code (min. 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input/70 border-border focus:ring-accent placeholder:text-muted-foreground/70" />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Creating Profile...</> : <><UserPlus className="mr-2 h-4 w-4"/> Complete Registration</>}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            
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
        </Tabs>
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
