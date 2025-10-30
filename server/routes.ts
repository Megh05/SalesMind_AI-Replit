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
  registerUserSchema,
  loginUserSchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import Papa from "papaparse";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateToken, authenticate, type AuthRequest } from "./middleware/auth";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }

      const existingUser = await storage.getUserByEmail(parsed.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      const token = generateToken(user.id);

      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }

      const user = await storage.getUserByEmail(parsed.data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(parsed.data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is inactive" });
      }

      const { password, ...userWithoutPassword } = user;
      const token = generateToken(user.id);

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", authenticate, async (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

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
  // MESSAGE ROUTES
  // ============================================

  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages/:id", async (req, res) => {
    try {
      const message = await storage.getMessageById(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
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
  // WEBHOOK ROUTES (Email Tracking)
  // ============================================

  // Helper function to verify SendGrid webhook signature
  async function verifySendGridSignature(
    payload: string,
    signature: string,
    timestamp: string
  ): Promise<boolean> {
    try {
      const sendgridConfig = await storage.getIntegrationSettingByProvider("sendgrid");
      if (!sendgridConfig || !sendgridConfig.config.webhookVerificationKey) {
        console.warn("SendGrid webhook verification key not configured");
        return false;
      }

      const verificationKey = sendgridConfig.config.webhookVerificationKey as string;
      const signedPayload = timestamp + payload;
      const expectedSignature = crypto
        .createHmac("sha256", verificationKey)
        .update(signedPayload)
        .digest("base64");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error("SendGrid signature verification error:", error);
      return false;
    }
  }

  // Helper function to verify Twilio webhook signature
  async function verifyTwilioSignature(
    url: string,
    params: Record<string, string>,
    signature: string
  ): Promise<boolean> {
    try {
      const twilioConfig = await storage.getIntegrationSettingByProvider("twilio");
      if (!twilioConfig || !twilioConfig.config.authToken) {
        console.warn("Twilio auth token not configured");
        return false;
      }

      const authToken = twilioConfig.config.authToken as string;

      // Sort params alphabetically and create the signature base
      const sortedKeys = Object.keys(params).sort();
      let data = url;
      for (const key of sortedKeys) {
        data += key + params[key];
      }

      const expectedSignature = crypto
        .createHmac("sha1", authToken)
        .update(Buffer.from(data, "utf-8"))
        .digest("base64");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error("Twilio signature verification error:", error);
      return false;
    }
  }

  app.post("/api/webhooks/sendgrid", async (req, res) => {
    try {
      // Verify SendGrid webhook signature
      const signature = req.headers["x-twilio-email-event-webhook-signature"] as string;
      const timestamp = req.headers["x-twilio-email-event-webhook-timestamp"] as string;

      if (signature && timestamp) {
        const rawBody = (req as any).rawBody;
        if (!rawBody) {
          console.error("No raw body available for signature verification");
          return res.status(400).json({ error: "Raw body required for signature verification" });
        }
        
        const payload = rawBody.toString("utf-8");
        const isValid = await verifySendGridSignature(payload, signature, timestamp);
        
        if (!isValid) {
          console.warn("Invalid SendGrid webhook signature");
          return res.status(403).json({ error: "Invalid signature" });
        }
        
        console.log("SendGrid webhook signature verified successfully");
      } else {
        console.warn("SendGrid webhook received without signature - accepting in development");
      }

      const events = Array.isArray(req.body) ? req.body : [req.body];

      for (const event of events) {
        const { event: eventType, sg_message_id, email, timestamp } = event;
        
        if (!sg_message_id) {
          continue;
        }

        // Find message by SendGrid message ID
        const messages = await storage.getMessages();
        const message = messages.find(
          (m) => m.metadata && (m.metadata as any).sendgridMessageId === sg_message_id
        );

        if (!message) {
          console.log(`Message not found for SendGrid ID: ${sg_message_id}`);
          continue;
        }

        const eventDate = timestamp ? new Date(timestamp * 1000) : new Date();

        // Update message based on event type
        switch (eventType) {
          case "delivered":
            await storage.updateMessage(message.id, {
              status: "delivered",
              deliveredAt: eventDate,
            });
            console.log(`Email delivered: ${message.id}`);
            break;

          case "open":
            if (!message.openedAt) {
              await storage.updateMessage(message.id, {
                openedAt: eventDate,
              });
              console.log(`Email opened: ${message.id}`);
            }
            break;

          case "click":
            if (!message.clickedAt) {
              await storage.updateMessage(message.id, {
                clickedAt: eventDate,
              });
              console.log(`Email clicked: ${message.id}`);
            }
            break;

          case "bounce":
          case "dropped":
            await storage.updateMessage(message.id, {
              status: "failed",
            });
            console.log(`Email ${eventType}: ${message.id}`);
            break;

          case "spamreport":
            await storage.updateMessage(message.id, {
              status: "failed",
            });
            console.log(`Email marked as spam: ${message.id}`);
            break;

          default:
            console.log(`Unhandled event type: ${eventType}`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhooks/twilio", async (req, res) => {
    try {
      // Verify Twilio webhook signature
      const signature = req.headers["x-twilio-signature"] as string;
      
      if (signature) {
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host = req.headers["host"];
        const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;
        
        const isValid = await verifyTwilioSignature(fullUrl, req.body, signature);
        
        if (!isValid) {
          console.warn("Invalid Twilio webhook signature");
          return res.status(403).json({ error: "Invalid signature" });
        }
        
        console.log("Twilio webhook signature verified successfully");
      } else {
        console.warn("Twilio webhook received without signature - accepting in development");
      }

      const { MessageSid, MessageStatus, To, From, Body } = req.body;

      if (!MessageSid) {
        return res.status(400).json({ error: "Missing MessageSid" });
      }

      // Find message by Twilio message SID
      const messages = await storage.getMessages();
      const message = messages.find(
        (m) => m.metadata && (m.metadata as any).twilioMessageSid === MessageSid
      );

      if (!message) {
        console.log(`Message not found for Twilio SID: ${MessageSid}`);
        return res.status(200).json({ received: true });
      }

      // Update message based on status
      switch (MessageStatus) {
        case "delivered":
          await storage.updateMessage(message.id, {
            status: "delivered",
            deliveredAt: new Date(),
          });
          console.log(`SMS delivered: ${message.id}`);
          break;

        case "failed":
        case "undelivered":
          await storage.updateMessage(message.id, {
            status: "failed",
          });
          console.log(`SMS ${MessageStatus}: ${message.id}`);
          break;

        default:
          console.log(`SMS status update: ${MessageStatus} for ${message.id}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Twilio webhook error:", error);
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

      // Enqueue workflow execution with BullMQ
      const { enqueueWorkflowExecution } = await import("./services/queue.service");
      await enqueueWorkflowExecution(execution.id, workflow.id, leadId);

      res.json(execution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/executions/:id/pause", async (req, res) => {
    try {
      const { pauseWorkflowExecution } = await import("./services/queue.service");
      const success = await pauseWorkflowExecution(req.params.id);
      
      if (success) {
        await storage.updateWorkflowExecution(req.params.id, { status: "paused" });
        res.json({ success: true, message: "Workflow paused" });
      } else {
        res.status(404).json({ error: "Workflow execution not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/executions/:id/resume", async (req, res) => {
    try {
      const { resumeWorkflowExecution } = await import("./services/queue.service");
      const success = await resumeWorkflowExecution(req.params.id);
      
      if (success) {
        await storage.updateWorkflowExecution(req.params.id, { status: "running" });
        res.json({ success: true, message: "Workflow resumed" });
      } else {
        res.status(404).json({ error: "Workflow execution not found" });
      }
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

  app.get("/api/workflows/executions/:id/status", async (req, res) => {
    try {
      const { getWorkflowJobStatus } = await import("./services/queue.service");
      const status = await getWorkflowJobStatus(req.params.id);
      
      if (status) {
        res.json(status);
      } else {
        res.status(404).json({ error: "Job not found" });
      }
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

  // ============================================
  // WEBHOOK ROUTES (Email Tracking)
  // ============================================

  app.post("/api/webhooks/sendgrid", async (req, res) => {
    try {
      const events = req.body;
      
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      for (const event of events) {
        const { event: eventType, sg_message_id, email } = event;
        
        if (!sg_message_id) continue;

        const messages = await storage.getMessages();
        const message = messages.find(m => {
          const metadata = (m as any).metadata;
          return metadata?.sendgridMessageId === sg_message_id;
        });

        if (!message) continue;

        const updates: any = {};

        switch (eventType) {
          case "delivered":
            updates.deliveredAt = new Date(event.timestamp * 1000);
            updates.status = "delivered";
            break;
          case "open":
            if (!message.openedAt) {
              updates.openedAt = new Date(event.timestamp * 1000);
            }
            break;
          case "click":
            if (!message.clickedAt) {
              updates.clickedAt = new Date(event.timestamp * 1000);
            }
            break;
          case "bounce":
          case "dropped":
            updates.status = "failed";
            break;
          case "spamreport":
            updates.status = "spam";
            break;
        }

        if (Object.keys(updates).length > 0) {
          await storage.updateMessage(message.id, updates);
        }
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhooks/twilio", async (req, res) => {
    try {
      const { MessageSid, MessageStatus, From, To } = req.body;

      if (!MessageSid) {
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      const messages = await storage.getMessages();
      const message = messages.find(m => {
        const metadata = (m as any).metadata;
        return metadata?.twilioMessageSid === MessageSid;
      });

      if (!message) {
        return res.status(200).json({ success: true });
      }

      const updates: any = {};

      switch (MessageStatus) {
        case "delivered":
          updates.deliveredAt = new Date();
          updates.status = "delivered";
          break;
        case "failed":
        case "undelivered":
          updates.status = "failed";
          break;
      }

      if (Object.keys(updates).length > 0) {
        await storage.updateMessage(message.id, updates);
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Twilio webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ANALYTICS ROUTES
  // ============================================

  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const [leadStats, workflowStats, messageStats] = await Promise.all([
        storage.getLeadStats(),
        storage.getWorkflowStats(),
        storage.getMessageStats(),
      ]);

      const messages = await storage.getMessages();
      
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const recentMessages = messages.filter(
        m => new Date(m.createdAt) >= last30Days
      );

      const engagementByDay = recentMessages.reduce((acc, msg) => {
        const date = new Date(msg.createdAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { sent: 0, opened: 0, clicked: 0, replied: 0 };
        }
        acc[date].sent++;
        if (msg.openedAt) acc[date].opened++;
        if (msg.clickedAt) acc[date].clicked++;
        if (msg.repliedAt) acc[date].replied++;
        return acc;
      }, {} as Record<string, any>);

      const engagementData = Object.entries(engagementByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          ...stats,
        }));

      const channelDistribution = messages.reduce((acc, msg) => {
        acc[msg.channel] = (acc[msg.channel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const channelPerformance = Object.entries(channelDistribution).map(([channel, count]) => {
        const channelMessages = messages.filter(m => m.channel === channel);
        const opens = channelMessages.filter(m => m.openedAt).length;
        const openRate = count > 0 ? Math.round((opens / count) * 100) : 0;
        return { channel, count, openRate };
      });

      res.json({
        leadStats,
        workflowStats,
        messageStats,
        engagementData,
        channelDistribution: Object.entries(channelDistribution).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        })),
        channelPerformance,
      });
    } catch (error: any) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
