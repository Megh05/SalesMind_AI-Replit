import type {
  Lead,
  InsertLead,
  Persona,
  InsertPersona,
  Workflow,
  InsertWorkflow,
  WorkflowNode,
  InsertWorkflowNode,
  WorkflowEdge,
  InsertWorkflowEdge,
  WorkflowExecution,
  InsertWorkflowExecution,
  Message,
  InsertMessage,
  IntegrationSetting,
  InsertIntegrationSetting,
} from "@shared/schema";

export interface IStorage {
  // Lead operations
  getLeads(): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;

  // Persona operations
  getPersonas(): Promise<Persona[]>;
  getPersonaById(id: string): Promise<Persona | undefined>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  updatePersona(id: string, persona: Partial<InsertPersona>): Promise<Persona | undefined>;
  deletePersona(id: string): Promise<boolean>;

  // Workflow operations
  getWorkflows(): Promise<Workflow[]>;
  getWorkflowById(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;

  // Workflow node operations
  getWorkflowNodes(workflowId: string): Promise<WorkflowNode[]>;
  createWorkflowNode(node: InsertWorkflowNode): Promise<WorkflowNode>;
  updateWorkflowNode(id: string, node: Partial<InsertWorkflowNode>): Promise<WorkflowNode | undefined>;
  deleteWorkflowNode(id: string): Promise<boolean>;
  deleteWorkflowNodesByWorkflow(workflowId: string): Promise<boolean>;

  // Workflow edge operations
  getWorkflowEdges(workflowId: string): Promise<WorkflowEdge[]>;
  createWorkflowEdge(edge: InsertWorkflowEdge): Promise<WorkflowEdge>;
  deleteWorkflowEdge(id: string): Promise<boolean>;
  deleteWorkflowEdgesByWorkflow(workflowId: string): Promise<boolean>;

  // Workflow execution operations
  getWorkflowExecutions(workflowId?: string): Promise<WorkflowExecution[]>;
  getWorkflowExecutionById(id: string): Promise<WorkflowExecution | undefined>;
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  updateWorkflowExecution(id: string, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined>;

  // Message operations
  getMessages(leadId?: string): Promise<Message[]>;
  getMessageById(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message | undefined>;

  // Integration settings operations
  getIntegrationSettings(): Promise<IntegrationSetting[]>;
  getIntegrationSettingByProvider(provider: string): Promise<IntegrationSetting | undefined>;
  upsertIntegrationSetting(setting: InsertIntegrationSetting): Promise<IntegrationSetting>;
  deleteIntegrationSetting(provider: string): Promise<boolean>;

  // Analytics operations
  getLeadStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byChannel: Record<string, number>;
  }>;
  getWorkflowStats(): Promise<{
    total: number;
    active: number;
    paused: number;
    draft: number;
  }>;
  getMessageStats(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
  }>;
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql, and } from "drizzle-orm";
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL!;
const client = neon(databaseUrl);
const db = drizzle(client, { schema });

export class DbStorage implements IStorage {
  // Lead operations
  async getLeads(): Promise<Lead[]> {
    return db.select().from(schema.leads).orderBy(schema.leads.createdAt);
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const result = await db.select().from(schema.leads).where(eq(schema.leads.id, id));
    return result[0];
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const result = await db.insert(schema.leads).values(lead).returning();
    return result[0];
  }

  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const result = await db
      .update(schema.leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(schema.leads.id, id))
      .returning();
    return result[0];
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(schema.leads).where(eq(schema.leads.id, id));
    return result.rowCount > 0;
  }

  // Persona operations
  async getPersonas(): Promise<Persona[]> {
    return db.select().from(schema.personas).orderBy(schema.personas.createdAt);
  }

  async getPersonaById(id: string): Promise<Persona | undefined> {
    const result = await db.select().from(schema.personas).where(eq(schema.personas.id, id));
    return result[0];
  }

  async createPersona(persona: InsertPersona): Promise<Persona> {
    const systemPrompt = this.generateSystemPrompt(persona);
    const result = await db
      .insert(schema.personas)
      .values({ ...persona, systemPrompt })
      .returning();
    return result[0];
  }

  async updatePersona(id: string, persona: Partial<InsertPersona>): Promise<Persona | undefined> {
    const updateData: any = { ...persona, updatedAt: new Date() };
    if (persona.tone || persona.industry || persona.description) {
      const existing = await this.getPersonaById(id);
      if (existing) {
        const merged = { ...existing, ...persona };
        updateData.systemPrompt = this.generateSystemPrompt(merged);
      }
    }
    const result = await db
      .update(schema.personas)
      .set(updateData)
      .where(eq(schema.personas.id, id))
      .returning();
    return result[0];
  }

  async deletePersona(id: string): Promise<boolean> {
    const result = await db.delete(schema.personas).where(eq(schema.personas.id, id));
    return result.rowCount > 0;
  }

  private generateSystemPrompt(persona: { tone: string; industry: string; description: string }): string {
    return `You are an AI sales assistant with the following characteristics:

Tone: ${persona.tone}
Industry: ${persona.industry}
Description: ${persona.description}

Your goal is to write compelling, personalized sales messages that:
- Match the specified tone and industry context
- Are concise and engaging
- Include a clear call-to-action
- Feel authentic and human-written
- Avoid generic sales language

Generate messages that would resonate with prospects in the ${persona.industry} industry while maintaining a ${persona.tone} tone.`;
  }

  // Workflow operations
  async getWorkflows(): Promise<Workflow[]> {
    return db.select().from(schema.workflows).orderBy(schema.workflows.createdAt);
  }

  async getWorkflowById(id: string): Promise<Workflow | undefined> {
    const result = await db.select().from(schema.workflows).where(eq(schema.workflows.id, id));
    return result[0];
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const result = await db.insert(schema.workflows).values(workflow).returning();
    return result[0];
  }

  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const result = await db
      .update(schema.workflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(eq(schema.workflows.id, id))
      .returning();
    return result[0];
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    await this.deleteWorkflowNodesByWorkflow(id);
    await this.deleteWorkflowEdgesByWorkflow(id);
    const result = await db.delete(schema.workflows).where(eq(schema.workflows.id, id));
    return result.rowCount > 0;
  }

  // Workflow node operations
  async getWorkflowNodes(workflowId: string): Promise<WorkflowNode[]> {
    return db.select().from(schema.workflowNodes).where(eq(schema.workflowNodes.workflowId, workflowId));
  }

  async createWorkflowNode(node: InsertWorkflowNode): Promise<WorkflowNode> {
    const result = await db.insert(schema.workflowNodes).values(node).returning();
    return result[0];
  }

  async updateWorkflowNode(id: string, node: Partial<InsertWorkflowNode>): Promise<WorkflowNode | undefined> {
    const result = await db
      .update(schema.workflowNodes)
      .set(node)
      .where(eq(schema.workflowNodes.id, id))
      .returning();
    return result[0];
  }

  async deleteWorkflowNode(id: string): Promise<boolean> {
    const result = await db.delete(schema.workflowNodes).where(eq(schema.workflowNodes.id, id));
    return result.rowCount > 0;
  }

  async deleteWorkflowNodesByWorkflow(workflowId: string): Promise<boolean> {
    await db.delete(schema.workflowNodes).where(eq(schema.workflowNodes.workflowId, workflowId));
    return true;
  }

  // Workflow edge operations
  async getWorkflowEdges(workflowId: string): Promise<WorkflowEdge[]> {
    return db.select().from(schema.workflowEdges).where(eq(schema.workflowEdges.workflowId, workflowId));
  }

  async createWorkflowEdge(edge: InsertWorkflowEdge): Promise<WorkflowEdge> {
    const result = await db.insert(schema.workflowEdges).values(edge).returning();
    return result[0];
  }

  async deleteWorkflowEdge(id: string): Promise<boolean> {
    const result = await db.delete(schema.workflowEdges).where(eq(schema.workflowEdges.id, id));
    return result.rowCount > 0;
  }

  async deleteWorkflowEdgesByWorkflow(workflowId: string): Promise<boolean> {
    await db.delete(schema.workflowEdges).where(eq(schema.workflowEdges.workflowId, workflowId));
    return true;
  }

  // Workflow execution operations
  async getWorkflowExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    if (workflowId) {
      return db
        .select()
        .from(schema.workflowExecutions)
        .where(eq(schema.workflowExecutions.workflowId, workflowId));
    }
    return db.select().from(schema.workflowExecutions);
  }

  async getWorkflowExecutionById(id: string): Promise<WorkflowExecution | undefined> {
    const result = await db
      .select()
      .from(schema.workflowExecutions)
      .where(eq(schema.workflowExecutions.id, id));
    return result[0];
  }

  async createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const result = await db.insert(schema.workflowExecutions).values(execution).returning();
    return result[0];
  }

  async updateWorkflowExecution(
    id: string,
    execution: Partial<InsertWorkflowExecution>
  ): Promise<WorkflowExecution | undefined> {
    const result = await db
      .update(schema.workflowExecutions)
      .set(execution)
      .where(eq(schema.workflowExecutions.id, id))
      .returning();
    return result[0];
  }

  // Message operations
  async getMessages(leadId?: string): Promise<Message[]> {
    if (leadId) {
      return db.select().from(schema.messages).where(eq(schema.messages.leadId, leadId));
    }
    return db.select().from(schema.messages).orderBy(schema.messages.createdAt);
  }

  async getMessageById(id: string): Promise<Message | undefined> {
    const result = await db.select().from(schema.messages).where(eq(schema.messages.id, id));
    return result[0];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(schema.messages).values(message).returning();
    return result[0];
  }

  async updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message | undefined> {
    const result = await db
      .update(schema.messages)
      .set(message)
      .where(eq(schema.messages.id, id))
      .returning();
    return result[0];
  }

  // Integration settings operations
  async getIntegrationSettings(): Promise<IntegrationSetting[]> {
    return db.select().from(schema.integrationSettings);
  }

  async getIntegrationSettingByProvider(provider: string): Promise<IntegrationSetting | undefined> {
    const result = await db
      .select()
      .from(schema.integrationSettings)
      .where(eq(schema.integrationSettings.provider, provider));
    return result[0];
  }

  async upsertIntegrationSetting(setting: InsertIntegrationSetting): Promise<IntegrationSetting> {
    const existing = await this.getIntegrationSettingByProvider(setting.provider);
    if (existing) {
      const result = await db
        .update(schema.integrationSettings)
        .set({ ...setting, updatedAt: new Date() })
        .where(eq(schema.integrationSettings.provider, setting.provider))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(schema.integrationSettings).values(setting).returning();
      return result[0];
    }
  }

  async deleteIntegrationSetting(provider: string): Promise<boolean> {
    const result = await db
      .delete(schema.integrationSettings)
      .where(eq(schema.integrationSettings.provider, provider));
    return result.rowCount > 0;
  }

  // Analytics operations
  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byChannel: Record<string, number>;
  }> {
    const leads = await this.getLeads();
    const byStatus: Record<string, number> = {};
    const byChannel: Record<string, number> = {};

    leads.forEach((lead) => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      byChannel[lead.channel] = (byChannel[lead.channel] || 0) + 1;
    });

    return {
      total: leads.length,
      byStatus,
      byChannel,
    };
  }

  async getWorkflowStats(): Promise<{
    total: number;
    active: number;
    paused: number;
    draft: number;
  }> {
    const workflows = await this.getWorkflows();
    const stats = {
      total: workflows.length,
      active: workflows.filter((w) => w.status === "active").length,
      paused: workflows.filter((w) => w.status === "paused").length,
      draft: workflows.filter((w) => w.status === "draft").length,
    };
    return stats;
  }

  async getMessageStats(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
  }> {
    const messages = await this.getMessages();
    return {
      total: messages.length,
      sent: messages.filter((m) => m.sentAt !== null).length,
      delivered: messages.filter((m) => m.deliveredAt !== null).length,
      opened: messages.filter((m) => m.openedAt !== null).length,
      clicked: messages.filter((m) => m.clickedAt !== null).length,
      replied: messages.filter((m) => m.repliedAt !== null).length,
    };
  }
}

export const storage = new DbStorage();
