#!/usr/bin/env node
/**
 * Routex402 MCP server. Exposes two tools over MCP (stdio transport):
 *  - check_agent_reputation(seller, policy?) → full report + recommendation
 *  - list_top_agents(limit?)                 → top sellers by reputation
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Routex402 } from "routex402-sdk";

const rx = new Routex402({
  baseUrl: process.env.ROUTEX402_BASE_URL,
  timeoutMs: 90_000,
});

const server = new Server(
  { name: "routex402", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "check_agent_reputation",
      description:
        "Use BEFORE paying an AI agent or Solana seller. Looks up Routex402 verified payment reputation (devnet) and returns score, tier, confidence, 5 vetting checks, and a proceed / do_not_pay recommendation. Read-only; cannot move funds.",
      inputSchema: {
        type: "object",
        properties: {
          seller: { type: "string", description: "Seller profile pubkey OR payout wallet (base58)" },
          policy: { type: "string", enum: ["standard", "strict", "off"], description: "Trust policy (default: standard)" },
        },
        required: ["seller"],
      },
    },
    {
      name: "list_top_agents",
      description:
        "Use when the user wants to find a trustworthy seller. Returns top Routex402 sellers ranked by reputation, with tier and confidence. Read-only.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max agents to return (1-20, default 5)" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === "check_agent_reputation") {
      const seller = String(args?.seller ?? "");
      const policy = (args?.policy ?? "standard") as "standard" | "strict" | "off";
      if (!seller) throw new Error("seller is required");
      const report = await rx.getAgent(seller, { policy });
      if (!report) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              seller, found: false,
              recommendation: "do_not_pay",
              blockReasons: ["No Routex402 record for this seller. It has no verified payment history."],
            }, null, 2),
          }],
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(report, null, 2) }] };
    }

    if (name === "list_top_agents") {
      const limit = Math.max(1, Math.min(20, Number(args?.limit ?? 5)));
      const agents = await rx.listTop(limit);
      return { content: [{ type: "text", text: JSON.stringify({ agents, count: agents.length }, null, 2) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err: any) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: err?.message ?? String(err) }, null, 2) }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
