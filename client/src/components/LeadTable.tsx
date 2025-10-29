import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Calendar, Linkedin, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Lead {
  id: string;
  name: string;
  company: string;
  status: "new" | "contacted" | "engaged" | "qualified" | "converted";
  lastContact: string;
  channel: "email" | "sms" | "linkedin" | "calendar";
  score: number;
}

interface LeadTableProps {
  leads: Lead[];
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  contacted: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  engaged: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  qualified: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  converted: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const channelIcons = {
  email: Mail,
  sms: MessageSquare,
  linkedin: Linkedin,
  calendar: Calendar,
};

export function LeadTable({ leads, onEdit, onDelete }: LeadTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const ChannelIcon = channelIcons[lead.channel];
            return (
              <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.company}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[lead.status]}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.lastContact}</TableCell>
                <TableCell>
                  <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell className="text-right font-mono">{lead.score}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-lead-actions-${lead.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(lead)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete?.(lead)} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
