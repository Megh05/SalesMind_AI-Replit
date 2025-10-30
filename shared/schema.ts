import { pgTable, text, integer, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("sales"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "sales", "viewer"]).default("sales"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

// Leads table
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  status: text("status").notNull().default("new"),
  channel: text("channel").notNull().default("email"),
  score: integer("score").notNull().default(0),
  customFields: jsonb("custom_fields").$type<Record<string, any>>(),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// AI Personas table
export const personas = pgTable("personas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  tone: text("tone").notNull(),
  industry: text("industry").notNull(),
  description: text("description").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPersonaSchema = createInsertSchema(personas).omit({
  id: true,
  messageCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPersona = z.infer<typeof insertPersonaSchema>;
export type Persona = typeof personas.$inferSelect;

// Workflows table
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("draft"),
  personaId: uuid("persona_id"),
  executionCount: integer("execution_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  executionCount: true,
  successCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

// Workflow nodes table
export const workflowNodes = pgTable("workflow_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull(),
  nodeType: text("node_type").notNull(),
  label: text("label").notNull(),
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
  config: jsonb("config").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkflowNodeSchema = createInsertSchema(workflowNodes).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowNode = z.infer<typeof insertWorkflowNodeSchema>;
export type WorkflowNode = typeof workflowNodes.$inferSelect;

// Workflow edges table
export const workflowEdges = pgTable("workflow_edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull(),
  sourceNodeId: text("source_node_id").notNull(),
  targetNodeId: text("target_node_id").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkflowEdgeSchema = createInsertSchema(workflowEdges).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowEdge = z.infer<typeof insertWorkflowEdgeSchema>;
export type WorkflowEdge = typeof workflowEdges.$inferSelect;

// Workflow executions table
export const workflowExecutions = pgTable("workflow_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull(),
  leadId: uuid("lead_id").notNull(),
  status: text("status").notNull().default("pending"),
  currentNodeId: text("current_node_id"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  startedAt: true,
});

export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;

// Message history table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  executionId: uuid("execution_id").notNull(),
  leadId: uuid("lead_id").notNull(),
  personaId: uuid("persona_id"),
  channel: text("channel").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Integration settings table
export const integrationSettings = pgTable("integration_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().unique(),
  config: jsonb("config").$type<Record<string, any>>().notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIntegrationSettingSchema = createInsertSchema(integrationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIntegrationSetting = z.infer<typeof insertIntegrationSettingSchema>;
export type IntegrationSetting = typeof integrationSettings.$inferSelect;
