import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonaCard } from "@/components/PersonaCard";
import { CreatePersonaDialog } from "@/components/CreatePersonaDialog";
import { Plus, Search } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Persona } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Personas() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: personas = [], isLoading } = useQuery<Persona[]>({
    queryKey: ["/api/personas"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/personas/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({
        title: "Success",
        description: "Persona deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete persona",
        variant: "destructive",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (persona: Persona) => {
      const { id, messageCount, createdAt, updatedAt, systemPrompt, ...data } = persona;
      return apiRequest("/api/personas", "POST", { ...data, name: `${data.name} (Copy)` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({
        title: "Success",
        description: "Persona duplicated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate persona",
        variant: "destructive",
      });
    },
  });

  const filteredPersonas = personas.filter((persona) =>
    persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.tone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePersona = async (data: any) => {
    try {
      await apiRequest("/api/personas", "POST", data);
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({
        title: "Success",
        description: "Persona created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create persona",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading personas...</div>
      </div>
    );
  }

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

      {filteredPersonas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No personas found. Create your first AI persona to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={() => console.log("Edit persona:", persona.id)}
              onDuplicate={() => duplicateMutation.mutate(persona)}
              onDelete={() => deleteMutation.mutate(persona.id)}
            />
          ))}
        </div>
      )}

      <CreatePersonaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreatePersona}
      />
    </div>
  );
}
