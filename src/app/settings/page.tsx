
"use client";

import { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Settings2, Palette, Bell, Brain, Cog, Users, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import AppLayout from '@/components/layout/AppLayout';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listUsers, assignRole } from '@/lib/userApi';
import { useRouter } from 'next/navigation';

interface UserRecord {
  uid: string;
  email: string | null;
  role: UserRole;
}

function UserManagementTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { forceRefreshUserToken } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userList = await listUsers();
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: "Error", description: "Could not fetch user list.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await assignRole(uid, role);
      toast({ title: "Success", description: `User role updated to ${role}.` });
      // Refresh the user list to show the new role
      await fetchUsers();
      // Force the current user's token to refresh if they changed their own role
      await forceRefreshUserToken();
    } catch (error) {
      console.error("Failed to assign role:", error);
      toast({ title: "Error", description: "Failed to update user role.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Assign roles to users in your organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>UID</TableHead>
              <TableHead className="w-[180px]">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{user.uid}</TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(value) => handleRoleChange(user.uid, value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


export default function SettingsPage() {
  const { toast } = useToast();
  const { role, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("AnalystUser01");
  const [timezone, setTimezone] = useState("utc-5");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [llmModel, setLlmModel] = useState("gemini-2.0-flash");
  const [aiSuggestions, setAiSuggestions] = useState(false);
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [emailCritical, setEmailCritical] = useState(true);
  const [inAppHigh, setInAppHigh] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState("subtle");

  useEffect(() => {
    if (!loading && role !== 'admin') {
      toast({ title: 'Access Denied', description: 'You do not have permission to view this page.', variant: 'destructive'});
      router.push('/dashboard');
    }
  }, [role, loading, router, toast]);

  const handleSave = (settingsCategory: string) => {
    toast({
      title: `${settingsCategory} Settings Saved!`,
      description: `Your ${settingsCategory.toLowerCase()} preferences have been updated (simulated).`,
      variant: "default",
    });
  };

  const handleThemeReset = () => {
    setFontSize("medium");
    setHighContrast(false);
    toast({
        title: "Theme Reset",
        description: "Theme settings have been reset to default (simulated)."
    });
  }

  if (loading || role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div>
        <PageHeader
          title="Application Settings"
          description="Configure Zizo_NetVerse to your preferences."
          icon={Settings2}
        />

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
            <TabsTrigger value="general"><Cog className="mr-2 h-4 w-4" />General</TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />User Management</TabsTrigger>
            <TabsTrigger value="aiConfig"><Brain className="mr-2 h-4 w-4" />AI Configuration</TabsTrigger>
            <TabsTrigger value="theme"><Palette className="mr-2 h-4 w-4" />Theme & Appearance</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic application preferences and user information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="max-w-sm bg-input border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-full max-w-sm bg-input border-border">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc-8">UTC-8 (Pacific Time)</SelectItem>
                      <SelectItem value="utc-5">UTC-5 (Eastern Time)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="utc+1">UTC+1 (Central European Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  <Label htmlFor="auto-refresh">Enable Auto-Refresh for Dashboards</Label>
                </div>
                <Button onClick={() => handleSave("General")} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save General Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="aiConfig">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Manage settings related to AI models and features.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="llmModel">Default Language Model</Label>
                  <Select value={llmModel} onValueChange={setLlmModel}>
                    <SelectTrigger className="w-full max-w-sm bg-input border-border">
                      <SelectValue placeholder="Select AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Default)</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro (Higher Quality)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Model used for text generation tasks.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageModel">Image Generation Model</Label>
                  <Input id="imageModel" defaultValue="googleai/gemini-2.0-flash-exp" disabled className="max-w-sm bg-muted border-border" />
                  <p className="text-xs text-muted-foreground">Currently fixed for image generation tasks.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="ai-suggestions" checked={aiSuggestions} onCheckedChange={setAiSuggestions} />
                  <Label htmlFor="ai-suggestions">Enable AI-Powered Suggestions</Label>
                </div>
                <Button onClick={() => handleSave("AI")} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save AI Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Theme & Appearance</CardTitle>
                <CardDescription>Customize the look and feel of Zizo_NetVerse.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Current Theme</Label>
                  <Input defaultValue="NetSense Sci-Fi (Dark)" disabled className="max-w-sm bg-muted border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Interface Font Size</Label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="w-full max-w-xs bg-input border-border">
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium (Default)</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="high-contrast" checked={highContrast} onCheckedChange={setHighContrast} />
                  <Label htmlFor="high-contrast">Enable High Contrast Mode</Label>
                </div>
                <Button onClick={handleThemeReset} variant="outline">Reset to Default Theme</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how and when you receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch id="email-critical" checked={emailCritical} onCheckedChange={setEmailCritical} />
                  <Label htmlFor="email-critical">Email notifications for Critical alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="inapp-high" checked={inAppHigh} onCheckedChange={setInAppHigh} />
                  <Label htmlFor="inapp-high">In-app notifications for High severity threats</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sound-alerts">Sound Alerts</Label>
                  <Select value={soundAlerts} onValueChange={setSoundAlerts}>
                    <SelectTrigger className="w-full max-w-xs bg-input border-border">
                      <SelectValue placeholder="Select alert sound" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="subtle">Subtle Beep</SelectItem>
                      <SelectItem value="digital">Digital Chime</SelectItem>
                      <SelectItem value="alarm">Sci-Fi Alarm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleSave("Notification")} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
