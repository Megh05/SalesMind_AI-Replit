import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, MessageSquare, CheckCircle, Clock, XCircle, Eye, MousePointerClick } from "lucide-react";
import type { Message } from "@shared/schema";
import { format } from "date-fns";

export default function Messages() {
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (message: Message) => {
    if (message.status === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (message.repliedAt) {
      return <Badge className="bg-purple-500">Replied</Badge>;
    }
    if (message.clickedAt) {
      return <Badge className="bg-blue-500">Clicked</Badge>;
    }
    if (message.openedAt) {
      return <Badge className="bg-green-500">Opened</Badge>;
    }
    if (message.deliveredAt) {
      return <Badge className="bg-teal-500">Delivered</Badge>;
    }
    if (message.sentAt) {
      return <Badge className="bg-yellow-500">Sent</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">View all sent messages and their tracking status</p>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Messages</h1>
        <p className="text-muted-foreground">
          View all sent messages and their tracking status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sent">
              {messages.filter((m) => m.sentAt).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-delivered">
              {messages.filter((m) => m.deliveredAt).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-opened">
              {messages.filter((m) => m.openedAt).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Replied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-replied">
              {messages.filter((m) => m.repliedAt).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No messages sent yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} data-testid={`card-message-${message.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getChannelIcon(message.channel)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold capitalize">{message.channel}</p>
                          {getStatusBadge(message)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {message.sentAt
                            ? `Sent ${format(new Date(message.sentAt), "MMM d, yyyy 'at' h:mm a")}`
                            : "Pending"}
                        </p>
                      </div>
                    </div>

                    <div className="pl-13">
                      <p className="text-sm line-clamp-2">{message.content}</p>
                    </div>

                    <div className="flex items-center gap-4 pl-13 text-xs text-muted-foreground">
                      {message.deliveredAt && (
                        <div className="flex items-center gap-1" data-testid={`status-delivered-${message.id}`}>
                          <CheckCircle className="h-3 w-3 text-teal-500" />
                          <span>Delivered {format(new Date(message.deliveredAt), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                      {message.openedAt && (
                        <div className="flex items-center gap-1" data-testid={`status-opened-${message.id}`}>
                          <Eye className="h-3 w-3 text-green-500" />
                          <span>Opened {format(new Date(message.openedAt), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                      {message.clickedAt && (
                        <div className="flex items-center gap-1" data-testid={`status-clicked-${message.id}`}>
                          <MousePointerClick className="h-3 w-3 text-blue-500" />
                          <span>Clicked {format(new Date(message.clickedAt), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                      {message.status === "failed" && (
                        <div className="flex items-center gap-1" data-testid={`status-failed-${message.id}`}>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>Failed to deliver</span>
                        </div>
                      )}
                      {!message.sentAt && (
                        <div className="flex items-center gap-1" data-testid={`status-pending-${message.id}`}>
                          <Clock className="h-3 w-3" />
                          <span>Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
