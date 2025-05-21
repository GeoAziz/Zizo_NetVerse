import PageHeader from '@/components/shared/PageHeader';
import { Settings2, Palette, Bell, Brain, Cog } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Application Settings"
        description="Configure NetSense to your preferences."
        icon={Settings2}
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="general"><Cog className="mr-2 h-4 w-4" />General</TabsTrigger>
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
                <Input id="username" defaultValue="AnalystUser01" className="max-w-sm bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc-5">
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
                <Switch id="auto-refresh" defaultChecked />
                <Label htmlFor="auto-refresh">Enable Auto-Refresh for Dashboards</Label>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Save General Settings</Button>
            </CardContent>
          </Card>
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
                <Select defaultValue="gemini-2.0-flash">
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
                <Switch id="ai-suggestions" />
                <Label htmlFor="ai-suggestions">Enable AI-Powered Suggestions</Label>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Save AI Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Theme & Appearance</CardTitle>
              <CardDescription>Customize the look and feel of NetSense.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Current Theme</Label>
                <Input defaultValue="NetSense Sci-Fi (Dark)" disabled className="max-w-sm bg-muted border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSize">Interface Font Size</Label>
                <Select defaultValue="medium">
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
                <Switch id="high-contrast" />
                <Label htmlFor="high-contrast">Enable High Contrast Mode</Label>
              </div>
              <Button variant="outline">Reset to Default Theme</Button>
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
                <Switch id="email-critical" defaultChecked />
                <Label htmlFor="email-critical">Email notifications for Critical alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="inapp-high" defaultChecked />
                <Label htmlFor="inapp-high">In-app notifications for High severity threats</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sound-alerts">Sound Alerts</Label>
                 <Select defaultValue="subtle">
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
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
