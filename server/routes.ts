import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertLeadSchema,
  insertPersonaSchema,
  insertWorkflowSchema,
  insertWorkflowNodeSchema,
  insertWorkflowEdgeSchema,
  insertIntegrationSettingSchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import Papa from "papaparse";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  // ============================================
  // LEAD ROUTES
  // ============================================

  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const parsed = insertLeadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const lead = await storage.createLead(parsed.data);
      res.status(201).json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const parsed = insertLeadSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const lead = await storage.updateLead(req.params.id, parsed.data);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const success = await storage.deleteLead(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/leads/export/csv", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      
      const data = leads.map(lead => ({
        Name: lead.name,
        Email: lead.email,
        Company: lead.company || "",
        Phone: lead.phone || "",
        Status: lead.status,
        Channel: lead.channel,
        Score: lead.score,
        "Last Contacted": lead.lastContactedAt?.toISOString() || "",
        "Created At": lead.createdAt.toISOString()
      }));

      const csv = Papa.unparse(data);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="leads.csv"');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/leads/import/csv", async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData || typeof csvData !== "string") {
        return res.status(400).json({ error: "CSV data is required" });
      }

      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({ 
          error: "CSV parsing failed",
          details: parseResult.errors
        });
      }

      const imported: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < parseResult.data.length; i++) {
        try {
          const row: any = parseResult.data[i];
          const leadData: any = {
            name: row.Name || row.name,
            email: row.Email || row.email,
            company: row.Company || row.company || undefined,
            phone: row.Phone || row.phone || undefined,
            status: row.Status || row.status || "new",
            channel: row.Channel || row.channel || "email",
            score: parseInt(row.Score || row.score || "0") || 0,
          };

          const parsed = insertLeadSchema.safeParse(leadData);
          if (!parsed.success) {
            errors.push({ row: i + 2, error: fromZodError(parsed.error).toString() });
            continue;
          }

          const lead = await storage.createLead(parsed.data);
          imported.push(lead);
        } catch (error: any) {
          errors.push({ row: i + 2, error: error.message });
        }
      }

      res.json({
        success: true,
        imported: imported.length,
        errors: errors.length,
        details: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PERSONA ROUTES
  // ============================================

  app.get("/api/personas", async (req, res) => {
    try {
      const personas = await storage.getPersonas();
      res.json(personas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/personas/:id", async (req, res) => {
    try {
      const persona = await storage.getPersonaById(req.params.id);
      if (!persona) {
        return res.status(404).json({ error: "Persona not found" });
      }
      res.json(persona);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/personas", async (req, res) => {
    try {
      const parsed = insertPersonaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const persona = await storage.createPersona(parsed.data);
      res.status(201).json(persona);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/personas/:id", async (req, res) => {
    try {
      const parsed = insertPersonaSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const persona = await storage.updatePersona(req.params.id, parsed.data);
      if (!persona) {
        return res.status(404).json({ error: "Persona not found" });
      }
      res.json(persona);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/personas/:id", async (req, res) => {
    try {
      const success = await storage.deletePersona(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Persona not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // WORKFLOW ROUTES
  // ============================================

  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      const workflowsWithNodes = await Promise.all(
        workflows.map(async (workflow) => {
          const nodes = await storage.getWorkflowNodes(workflow.id);
          const edges = await storage.getWorkflowEdges(workflow.id);
          const successRate =
            workflow.executionCount > 0
              ? Math.round((workflow.successCount / workflow.executionCount) * 100)
              : 0;
          return {
            ...workflow,
            nodeCount: nodes.length,
            successRate,
          };
        })
      );
      res.json(workflowsWithNodes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      const nodes = await storage.getWorkflowNodes(workflow.id);
      const edges = await storage.getWorkflowEdges(workflow.id);
      res.json({ ...workflow, nodes, edges });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const parsed = insertWorkflowSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const workflow = await storage.createWorkflow(parsed.data);
      res.status(201).json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const parsed = insertWorkflowSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const workflow = await storage.updateWorkflow(req.params.id, parsed.data);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkflow(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // WORKFLOW NODE ROUTES
  // ============================================

  app.post("/api/workflows/:workflowId/nodes", async (req, res) => {
    try {
      const parsed = insertWorkflowNodeSchema.safeParse({
        ...req.body,
        workflowId: req.params.workflowId,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const node = await storage.createWorkflowNode(parsed.data);
      res.status(201).json(node);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/workflows/nodes/:id", async (req, res) => {
    try {
      const parsed = insertWorkflowNodeSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const node = await storage.updateWorkflowNode(req.params.id, parsed.data);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.json(node);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/nodes/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkflowNode(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // WORKFLOW EDGE ROUTES
  // ============================================

  app.post("/api/workflows/:workflowId/edges", async (req, res) => {
    try {
      const parsed = insertWorkflowEdgeSchema.safeParse({
        ...req.body,
        workflowId: req.params.workflowId,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const edge = await storage.createWorkflowEdge(parsed.data);
      res.status(201).json(edge);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/edges/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkflowEdge(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Edge not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // INTEGRATION SETTINGS ROUTES
  // ============================================

  app.get("/api/integrations", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      const sanitized = settings.map((s) => ({
        ...s,
        config: Object.keys(s.config).reduce((acc, key) => {
          acc[key] = "***";
          return acc;
        }, {} as Record<string, string>),
      }));
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/integrations/:provider", async (req, res) => {
    try {
      const parsed = insertIntegrationSettingSchema.safeParse({
        ...req.body,
        provider: req.params.provider,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }
      const setting = await storage.upsertIntegrationSetting(parsed.data);
      res.json({
        ...setting,
        config: Object.keys(setting.config).reduce((acc, key) => {
          acc[key] = "***";
          return acc;
        }, {} as Record<string, string>),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ANALYTICS ROUTES
  // ============================================

  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const leadStats = await storage.getLeadStats();
      const workflowStats = await storage.getWorkflowStats();
      const messageStats = await storage.getMessageStats();

      const engagementRate =
        messageStats.total > 0 ? ((messageStats.opened / messageStats.total) * 100).toFixed(1) : "0.0";
      const conversionRate =
        leadStats.total > 0
          ? (((leadStats.byStatus.converted || 0) / leadStats.total) * 100).toFixed(1)
          : "0.0";

      res.json({
        stats: {
          totalLeads: leadStats.total,
          messagesSent: messageStats.sent,
          engagementRate: `${engagementRate}%`,
          conversionRate: `${conversionRate}%`,
        },
        leadStats,
        workflowStats,
        messageStats,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AI MESSAGE GENERATION ROUTE
  // ============================================

  app.post("/api/ai/generate-message", async (req, res) => {
    try {
      const { personaId, leadInfo, context } = req.body;

      if (!personaId) {
        return res.status(400).json({ error: "Persona ID is required" });
      }

      const persona = await storage.getPersonaById(personaId);
      if (!persona) {
        return res.status(404).json({ error: "Persona not found" });
      }

      const openrouterSetting = await storage.getIntegrationSettingByProvider("openrouter");
      if (!openrouterSetting || !openrouterSetting.isActive) {
        return res.status(400).json({
          error: "OpenRouter integration not configured. Please add your API key in Settings.",
        });
      }

      const apiKey = openrouterSetting.config.apiKey;
      if (!apiKey) {
        return res.status(400).json({ error: "OpenRouter API key not found" });
      }

      const userPrompt = `Generate a personalized sales message for the following prospect:

Name: ${leadInfo?.name || "Prospect"}
Company: ${leadInfo?.company || "their company"}
${context ? `Additional context: ${context}` : ""}

The message should be professional, concise, and include a clear call-to-action.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://omnireach.ai",
          "X-Title": "OmniReach Sales Platform",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            { role: "system", content: persona.systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const generatedMessage = data.choices?.[0]?.message?.content;

      if (!generatedMessage) {
        throw new Error("No message generated from AI");
      }

      await storage.updatePersona(personaId, {
        messageCount: persona.messageCount + 1,
      } as any);

      res.json({ message: generatedMessage });
    } catch (error: any) {
      console.error("AI generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // WORKFLOW EXECUTION ROUTES
  // ============================================

  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const { leadId } = req.body;
      if (!leadId) {
        return res.status(400).json({ error: "Lead ID is required" });
      }

      const workflow = await storage.getWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const execution = await storage.createWorkflowExecution({
        workflowId: workflow.id,
        leadId,
        status: "pending",
      });

      // Execute workflow asynchronously
      const { workflowExecutor } = await import("./services/workflow-executor.service");
      workflowExecutor.executeWorkflow(execution.id).catch((error) => {
        console.error("Workflow execution failed:", error);
      });

      res.json(execution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/executions", async (req, res) => {
    try {
      const executions = await storage.getWorkflowExecutions(req.params.id);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // MESSAGE ROUTES
  // ============================================

  app.get("/api/messages", async (req, res) => {
    try {
      const { leadId } = req.query;
      const messages = await storage.getMessages(leadId as string | undefined);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
