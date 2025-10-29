import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonaCard, Persona } from "@/components/PersonaCard";
import { CreatePersonaDialog } from "@/components/CreatePersonaDialog";
import { Plus, Search } from "lucide-react";

//todo: remove mock functionality
const mockPersonas: Persona[] = [
  {
    id: "1",
    name: "Tech Sales Pro",
    tone: "Professional",
    industry: "Technology",
    description: "Expert in B2B SaaS sales with a consultative approach. Uses data-driven insights to personalize outreach.",
    messageCount: 1234,
  },
  {
    id: "2",
    name: "Friendly Advisor",
    tone: "Friendly",
    industry: "Finance",
    description: "Warm and approachable persona focused on building long-term relationships with financial services clients.",
    messageCount: 892,
  },
  {
    id: "3",
    name: "Executive Connector",
    tone: "Formal",
    industry: "Enterprise",
    description: "High-level persona for C-suite outreach with sophisticated language and strategic positioning.",
    messageCount: 567,
  },
  {
    id: "4",
    name: "Startup Enthusiast",
    tone: "Enthusiastic",
    industry: "Startups",
    description: "Energetic and innovative persona tailored for early-stage companies and founders.",
    messageCount: 743,
  },
  {
    id: "5",
    name: "Healthcare Specialist",
    tone: "Professional",
    industry: "Healthcare",
    description: "Compliant and knowledgeable persona for healthcare industry outreach with regulatory awareness.",
    messageCount: 456,
  },
  {
    id: "6",
    name: "Retail Expert",
    tone: "Casual",
    industry: "Retail",
    description: "Conversational persona optimized for retail and e-commerce businesses.",
    messageCount: 621,
  },
];

export default function Personas() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPersonas = mockPersonas.filter((persona) =>
    persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.tone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Personas</h1>
          <p className="text-muted-foreground">
            Create and customize AI personas for personalized outreach
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-persona">
          <Plus className="h-4 w-4 mr-2" />
          New Persona
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search personas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-personas"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onEdit={() => console.log("Edit persona:", persona.id)}
            onDuplicate={() => console.log("Duplicate persona:", persona.id)}
            onDelete={() => console.log("Delete persona:", persona.id)}
          />
        ))}
      </div>

      <CreatePersonaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => console.log("Persona created:", data)}
      />
    </div>
  );
}
