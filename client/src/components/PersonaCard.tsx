import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Copy, Trash2 } from "lucide-react";

export interface Persona {
  id: string;
  name: string;
  tone: string;
  industry: string;
  description: string;
  messageCount: number;
}

interface PersonaCardProps {
  persona: Persona;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function PersonaCard({ persona, onEdit, onDuplicate, onDelete }: PersonaCardProps) {
  const initials = persona.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card data-testid={`card-persona-${persona.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base mb-1">{persona.name}</CardTitle>
            <div className="flex flex-wrap gap-1 mb-2">
              <Badge variant="outline" className="text-xs">{persona.tone}</Badge>
              <Badge variant="outline" className="text-xs">{persona.industry}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            data-testid={`button-edit-persona-${persona.id}`}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDuplicate}
            data-testid={`button-duplicate-persona-${persona.id}`}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDelete}
            data-testid={`button-delete-persona-${persona.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {persona.description}
        </p>
        <div className="text-xs text-muted-foreground">
          {persona.messageCount} messages sent
        </div>
      </CardContent>
    </Card>
  );
}
