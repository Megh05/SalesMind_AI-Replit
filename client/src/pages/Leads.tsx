import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadTable, Lead } from "@/components/LeadTable";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { Plus, Upload, Download, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

//todo: remove mock functionality
const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Sarah Chen",
    company: "TechCorp Inc",
    status: "qualified",
    lastContact: "2 hours ago",
    channel: "email",
    score: 92,
  },
  {
    id: "2",
    name: "Michael Roberts",
    company: "Innovate Labs",
    status: "engaged",
    lastContact: "1 day ago",
    channel: "linkedin",
    score: 78,
  },
  {
    id: "3",
    name: "Emily Watson",
    company: "Global Solutions",
    status: "contacted",
    lastContact: "3 days ago",
    channel: "sms",
    score: 65,
  },
  {
    id: "4",
    name: "David Kim",
    company: "Future Tech",
    status: "new",
    lastContact: "5 days ago",
    channel: "email",
    score: 54,
  },
  {
    id: "5",
    name: "Jessica Martinez",
    company: "Alpha Systems",
    status: "converted",
    lastContact: "1 week ago",
    channel: "calendar",
    score: 98,
  },
  {
    id: "6",
    name: "Robert Johnson",
    company: "Digital Ventures",
    status: "new",
    lastContact: "2 weeks ago",
    channel: "email",
    score: 48,
  },
];

export default function Leads() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Manage and track your sales leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-import-leads">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" data-testid="button-export-leads">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-lead">
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-leads"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="contacted">Contacted</TabsTrigger>
            <TabsTrigger value="engaged">Engaged</TabsTrigger>
            <TabsTrigger value="qualified">Qualified</TabsTrigger>
            <TabsTrigger value="converted">Converted</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <LeadTable
        leads={filteredLeads}
        onEdit={(lead) => console.log("Edit lead:", lead)}
        onDelete={(lead) => console.log("Delete lead:", lead)}
      />

      <CreateLeadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => console.log("Lead created:", data)}
      />
    </div>
  );
}
