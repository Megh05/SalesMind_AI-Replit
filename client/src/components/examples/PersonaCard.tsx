import { PersonaCard } from "../PersonaCard";

const mockPersona = {
  id: "1",
  name: "Tech Sales Pro",
  tone: "Professional",
  industry: "Technology",
  description: "Expert in B2B SaaS sales with a consultative approach. Uses data-driven insights to personalize outreach.",
  messageCount: 1234,
};

export default function PersonaCardExample() {
  return (
    <div className="p-8 max-w-md">
      <PersonaCard
        persona={mockPersona}
        onEdit={() => console.log("Edit persona")}
        onDuplicate={() => console.log("Duplicate persona")}
        onDelete={() => console.log("Delete persona")}
      />
    </div>
  );
}
