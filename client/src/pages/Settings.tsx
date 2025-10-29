import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { toast } = useToast();
  const [sendgridKey, setSendgridKey] = useState("");
  const [sendgridFromEmail, setSendgridFromEmail] = useState("");
  const [sendgridFromName, setSendgridFromName] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");

  const saveIntegrationMutation = useMutation({
    mutationFn: ({ provider, config }: { provider: string; config: any }) =>
      apiRequest(`/api/integrations/${provider}`, "PUT", { provider, config, isActive: true }),
    onSuccess: (_: any, variables: { provider: string; config: any }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Success",
        description: `${variables.provider} integration saved successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save integration settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSendGrid = () => {
    if (!sendgridKey || !sendgridFromEmail) {
      toast({
        title: "Error",
        description: "Please enter SendGrid API key and sender email",
        variant: "destructive",
      });
      return;
    }
    saveIntegrationMutation.mutate({
      provider: "sendgrid",
      config: { 
        apiKey: sendgridKey,
        fromEmail: sendgridFromEmail,
        fromName: sendgridFromName || "OmniReach"
      },
    });
  };

  const handleSaveTwilio = () => {
    if (!twilioSid || !twilioToken || !twilioFromNumber) {
      toast({
        title: "Error",
        description: "Please enter Twilio credentials and phone number",
        variant: "destructive",
      });
      return;
    }
    saveIntegrationMutation.mutate({
      provider: "twilio",
      config: { 
        accountSid: twilioSid, 
        authToken: twilioToken,
        fromNumber: twilioFromNumber
      },
    });
  };

  const handleSaveOpenRouter = () => {
    if (!openrouterKey) {
      toast({
        title: "Error",
        description: "Please enter an OpenRouter API key",
        variant: "destructive",
      });
      return;
    }
    saveIntegrationMutation.mutate({
      provider: "openrouter",
      config: { apiKey: openrouterKey },
    });
  };

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
                Configure your email sending service (SendGrid recommended)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                <Input
                  id="sendgrid-key"
                  type="password"
                  placeholder="Enter API key"
                  value={sendgridKey}
                  onChange={(e) => setSendgridKey(e.target.value)}
                  data-testid="input-sendgrid-key"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sendgrid-from-email">Sender Email Address</Label>
                <Input
                  id="sendgrid-from-email"
                  type="email"
                  placeholder="sales@yourcompany.com"
                  value={sendgridFromEmail}
                  onChange={(e) => setSendgridFromEmail(e.target.value)}
                  data-testid="input-sendgrid-from-email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sendgrid-from-name">Sender Name (Optional)</Label>
                <Input
                  id="sendgrid-from-name"
                  placeholder="Your Sales Team"
                  value={sendgridFromName}
                  onChange={(e) => setSendgridFromName(e.target.value)}
                  data-testid="input-sendgrid-from-name"
                />
              </div>
              <Button onClick={handleSaveSendGrid} data-testid="button-save-sendgrid">
                Save SendGrid Settings
              </Button>
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
                <Input
                  id="twilio-sid"
                  placeholder="Enter Account SID"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  data-testid="input-twilio-sid"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twilio-token">Auth Token</Label>
                <Input
                  id="twilio-token"
                  type="password"
                  placeholder="Enter Auth Token"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  data-testid="input-twilio-token"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twilio-from-number">Phone Number</Label>
                <Input
                  id="twilio-from-number"
                  placeholder="+1234567890"
                  value={twilioFromNumber}
                  onChange={(e) => setTwilioFromNumber(e.target.value)}
                  data-testid="input-twilio-from-number"
                />
              </div>
              <Button onClick={handleSaveTwilio} data-testid="button-save-twilio">
                Save Twilio Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Provider</CardTitle>
              <CardDescription>
                Configure OpenRouter for Mistral AI message generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                <Input
                  id="openrouter-key"
                  type="password"
                  placeholder="Enter API key"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  data-testid="input-openrouter-key"
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    openrouter.ai/keys
                  </a>
                </p>
              </div>
              <Button onClick={handleSaveOpenRouter} data-testid="button-save-openrouter">
                Save OpenRouter Settings
              </Button>
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
