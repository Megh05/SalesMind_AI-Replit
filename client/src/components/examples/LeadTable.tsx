import { LeadTable } from "../LeadTable";

const mockLeads = [
  {
    id: "1",
    name: "Sarah Chen",
    company: "TechCorp Inc",
    status: "qualified" as const,
    lastContact: "2 hours ago",
    channel: "email" as const,
    score: 92,
  },
  {
    id: "2",
    name: "Michael Roberts",
    company: "Innovate Labs",
    status: "engaged" as const,
    lastContact: "1 day ago",
    channel: "linkedin" as const,
    score: 78,
  },
  {
    id: "3",
    name: "Emily Watson",
    company: "Global Solutions",
    status: "contacted" as const,
    lastContact: "3 days ago",
    channel: "sms" as const,
    score: 65,
  },
  {
    id: "4",
    name: "David Kim",
    company: "Future Tech",
    status: "new" as const,
    lastContact: "5 days ago",
    channel: "email" as const,
    score: 54,
  },
  {
    id: "5",
    name: "Jessica Martinez",
    company: "Alpha Systems",
    status: "converted" as const,
    lastContact: "1 week ago",
    channel: "calendar" as const,
    score: 98,
  },
];

export default function LeadTableExample() {
  return (
    <div className="p-8">
      <LeadTable
        leads={mockLeads}
        onEdit={(lead) => console.log("Edit lead:", lead)}
        onDelete={(lead) => console.log("Delete lead:", lead)}
      />
    </div>
  );
}
