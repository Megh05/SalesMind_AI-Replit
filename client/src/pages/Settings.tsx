import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" data-testid="input-name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@example.com" data-testid="input-email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" defaultValue="Acme Corp" data-testid="input-company" />
              </div>
              <Button data-testid="button-save-general">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Provider</CardTitle>
              <CardDescription>
                Configure your email sending service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                <Input id="sendgrid-key" type="password" placeholder="Enter API key" data-testid="input-sendgrid-key" />
              </div>
              <Button data-testid="button-save-sendgrid">Save</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Provider</CardTitle>
              <CardDescription>
                Configure Twilio for SMS messaging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="twilio-sid">Account SID</Label>
                <Input id="twilio-sid" placeholder="Enter Account SID" data-testid="input-twilio-sid" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twilio-token">Auth Token</Label>
                <Input id="twilio-token" type="password" placeholder="Enter Auth Token" data-testid="input-twilio-token" />
              </div>
              <Button data-testid="button-save-twilio">Save</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Provider</CardTitle>
              <CardDescription>
                Configure OpenRouter / Mistral AI for message generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                <Input id="openrouter-key" type="password" placeholder="Enter API key" data-testid="input-openrouter-key" />
              </div>
              <Button data-testid="button-save-openrouter">Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about workflow executions
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-email-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Workflow Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when workflows fail or need attention
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-workflow-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lead Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications for important lead status changes
                  </p>
                </div>
                <Switch data-testid="switch-lead-updates" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <Input value="sk_live_••••••••••••••••••••" readOnly data-testid="input-api-key" />
                  <Button variant="outline" data-testid="button-copy-api-key">Copy</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep your API key secret. Do not share it publicly.
                </p>
              </div>
              <Button variant="destructive" data-testid="button-regenerate-api-key">
                Regenerate API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
