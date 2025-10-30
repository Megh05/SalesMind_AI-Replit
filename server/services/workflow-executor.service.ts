import { storage } from "../storage";
import { channelAdapter } from "./channel-adapter.service";
import type { WorkflowNode, WorkflowEdge, Lead, Persona } from "@shared/schema";

export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  leadId: string;
  lead?: Lead;
  personaId?: string;
  persona?: Persona;
  variables: Record<string, any>;
}

export class WorkflowExecutorService {
  async executeWorkflow(executionId: string): Promise<void> {
    try {
      const execution = await storage.getWorkflowExecutionById(executionId);
      if (!execution) {
        throw new Error("Execution not found");
      }

      // Check if execution is paused
      if (execution.status === "paused") {
        console.log(`Workflow execution ${executionId} is paused, skipping`);
        throw new Error("Workflow is paused");
      }

      const workflow = await storage.getWorkflowById(execution.workflowId);
      if (!workflow) {
        throw new Error("Workflow not found");
      }

      const lead = await storage.getLeadById(execution.leadId);
      if (!lead) {
        throw new Error("Lead not found");
      }

      const nodes = await storage.getWorkflowNodes(execution.workflowId);
      const edges = await storage.getWorkflowEdges(execution.workflowId);

      // Get persona if workflow has one
      let persona;
      if (workflow.personaId) {
        persona = await storage.getPersonaById(workflow.personaId);
      }

      // Start execution
      await storage.updateWorkflowExecution(executionId, {
        status: "running",
      } as any);

      const context: WorkflowExecutionContext = {
        workflowId: workflow.id,
        executionId,
        leadId: lead.id,
        lead,
        personaId: workflow.personaId || undefined,
        persona,
        variables: {},
      };

      // Find start node (node with no incoming edges or first node)
      const startNode = this.findStartNode(nodes, edges);
      if (!startNode) {
        throw new Error("No start node found in workflow");
      }

      // Execute nodes with a fresh visited set for cycle detection
      const visited = new Set<string>();
      await this.executeNode(startNode, nodes, edges, context, visited);

      // Mark as completed
      await storage.updateWorkflowExecution(executionId, {
        status: "completed",
        completedAt: new Date(),
      });

      // Update workflow stats
      await storage.updateWorkflow(workflow.id, {
        executionCount: workflow.executionCount + 1,
        successCount: workflow.successCount + 1,
      } as any);
    } catch (error: any) {
      console.error("Workflow execution error:", error);
      await storage.updateWorkflowExecution(executionId, {
        status: "failed",
        completedAt: new Date(),
        error: error.message,
      });
      throw error;
    }
  }

  private findStartNode(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode | null {
    // Find node with no incoming edges
    const nodeIds = new Set(nodes.map((n) => n.id));
    const targetNodeIds = new Set(edges.map((e) => e.targetNodeId));

    for (const node of nodes) {
      if (!targetNodeIds.has(node.id)) {
        return node;
      }
    }

    // If all nodes have incoming edges, return first node
    return nodes[0] || null;
  }

  private async executeNode(
    node: WorkflowNode,
    allNodes: WorkflowNode[],
    allEdges: WorkflowEdge[],
    context: WorkflowExecutionContext,
    visited: Set<string> = new Set()
  ): Promise<void> {
    // Cycle detection - prevent infinite loops in the current execution path
    const pathKey = node.id;
    if (visited.has(pathKey)) {
      console.warn(`Cycle detected at node ${node.id}, stopping execution on this path`);
      return;
    }

    // Add to visited for cycle detection (will be removed via backtracking)
    visited.add(pathKey);

    try {
      console.log(`Executing node: ${node.label} (${node.nodeType})`);

      // Update execution current node
      await storage.updateWorkflowExecution(context.executionId, {
        currentNodeId: node.id,
      });

      // Execute node based on type
      let nextNodeId: string | null = null;
      
      switch (node.nodeType) {
        case "ai":
          await this.executeAINode(node, context);
          break;
        case "email":
          await this.executeEmailNode(node, context);
          break;
        case "sms":
          await this.executeSMSNode(node, context);
          break;
        case "wait":
          await this.executeWaitNode(node, context);
          break;
        case "decision":
          nextNodeId = await this.executeDecisionNode(node, context, allEdges);
          break;
        default:
          console.log(`Unknown node type: ${node.nodeType}`);
      }

      // For decision nodes, only execute the chosen branch
      if (node.nodeType === "decision" && nextNodeId) {
        const nextNode = allNodes.find((n) => n.id === nextNodeId);
        if (nextNode) {
          await this.executeNode(nextNode, allNodes, allEdges, context, visited);
        }
        return;
      }

      // For non-decision nodes, execute all outgoing edges sequentially
      const nextEdges = allEdges.filter((e) => e.sourceNodeId === node.id);
      
      for (const edge of nextEdges) {
        const nextNode = allNodes.find((n) => n.id === edge.targetNodeId);
        if (nextNode) {
          await this.executeNode(nextNode, allNodes, allEdges, context, visited);
        }
      }
    } finally {
      // Backtrack - remove from visited to allow convergent paths
      visited.delete(pathKey);
    }
  }

  private async executeAINode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    if (!context.persona) {
      console.warn("No persona configured for AI node");
      return;
    }

    const openrouterSetting = await storage.getIntegrationSettingByProvider("openrouter");
    if (!openrouterSetting || !openrouterSetting.isActive) {
      throw new Error("OpenRouter integration not configured");
    }

    const apiKey = openrouterSetting.config.apiKey as string;

    const userPrompt = `Generate a personalized sales message for the following prospect:

Name: ${context.lead?.name || "Prospect"}
Company: ${context.lead?.company || "their company"}
Email: ${context.lead?.email || ""}

The message should be professional, concise, and include a clear call-to-action.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://omnireach.app",
        "X-Title": "OmniReach Sales Platform",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: context.persona.systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedMessage = data.choices?.[0]?.message?.content;

    if (!generatedMessage) {
      throw new Error("No message generated from AI");
    }

    // Store generated message in context
    context.variables.aiGeneratedMessage = generatedMessage;
    context.variables.aiGeneratedSubject = `Message from ${context.persona.name}`;

    console.log("AI generated message:", generatedMessage.substring(0, 100) + "...");
  }

  private async executeEmailNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    if (!context.lead?.email) {
      throw new Error("Lead has no email address");
    }

    const subject = context.variables.aiGeneratedSubject || node.config?.subject || "Message from OmniReach";
    const content = context.variables.aiGeneratedMessage || node.config?.content || "Hello!";

    const result = await channelAdapter.send("email", {
      to: context.lead.email,
      subject,
      content,
    });

    if (!result.success) {
      throw new Error(`Failed to send email: ${result.error}`);
    }

    // Record message in database with tracking metadata including messageId
    const metadata: Record<string, any> = {};
    if (result.messageId) {
      metadata.sendgridMessageId = result.messageId;
    }

    await storage.createMessage({
      executionId: context.executionId,
      leadId: context.leadId,
      personaId: context.personaId,
      channel: result.channel,
      content,
      status: "sent",
      metadata: Object.keys(metadata).length > 0 ? metadata as any : undefined,
      sentAt: new Date(),
    });

    console.log(`Email sent to ${context.lead.email} via ${result.channel} (messageId: ${result.messageId || "none"})`);
  }

  private async executeSMSNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    if (!context.lead?.phone) {
      throw new Error("Lead has no phone number");
    }

    const content = context.variables.aiGeneratedMessage || node.config?.content || "Hello!";

    const result = await channelAdapter.send("sms", {
      to: context.lead.phone,
      content,
    });

    if (!result.success) {
      throw new Error(`Failed to send SMS: ${result.error}`);
    }

    // Record message in database with tracking metadata including messageId
    const metadata: Record<string, any> = {};
    if (result.messageId) {
      metadata.twilioMessageSid = result.messageId;
    }

    await storage.createMessage({
      executionId: context.executionId,
      leadId: context.leadId,
      personaId: context.personaId,
      channel: result.channel,
      content,
      status: "sent",
      metadata: Object.keys(metadata).length > 0 ? metadata as any : undefined,
      sentAt: new Date(),
    });

    console.log(`SMS sent to ${context.lead.phone} via ${result.channel} (messageId: ${result.messageId || "none"})`);
  }

  private async executeWaitNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const waitMinutes = node.config?.waitMinutes || 0;
    if (waitMinutes > 0) {
      console.log(`Would wait ${waitMinutes} minutes (skipping for now)`);
      // In a real implementation with job queues, we'd schedule the next node
    }
  }

  private async executeDecisionNode(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    allEdges: WorkflowEdge[]
  ): Promise<string | null> {
    // Decision logic - evaluates conditions and returns the chosen branch
    console.log("Decision node - evaluating conditions");
    
    const outgoingEdges = allEdges.filter((e) => e.sourceNodeId === node.id);
    if (outgoingEdges.length === 0) {
      return null;
    }

    // Simple condition evaluation based on lead status or custom logic
    // For now, default to first edge if no conditions are configured
    const condition = node.config?.condition;
    
    if (condition) {
      // Example: Check if lead has been contacted before
      if (condition === "has_email" && context.lead?.email) {
        const emailEdge = outgoingEdges.find((e) => e.label?.toLowerCase().includes("yes"));
        return emailEdge?.targetNodeId || outgoingEdges[0].targetNodeId;
      }
      
      if (condition === "has_phone" && context.lead?.phone) {
        const phoneEdge = outgoingEdges.find((e) => e.label?.toLowerCase().includes("yes"));
        return phoneEdge?.targetNodeId || outgoingEdges[0].targetNodeId;
      }
    }

    // Default: take first edge
    return outgoingEdges[0].targetNodeId;
  }
}

export const workflowExecutor = new WorkflowExecutorService();
