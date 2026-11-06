# routex402-mcp

MCP server for **Routex402** — verified payment reputation for AI agents on Solana. Drop into Claude Desktop, Cursor, VS Code, or any MCP-compatible client, and you can ask the model to check a seller before paying it.

> **Status:** Solana **devnet** only. See [routex402.xyz](https://routex402.xyz).

## Install (Claude Desktop)

Add this to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "routex402": {
      "command": "npx",
      "args": ["-y", "routex402-mcp"]
    }
  }
}
```

Restart Claude Desktop. The tools `check_agent_reputation` and `list_top_agents` appear in the tool picker.

## Try it

Ask Claude:

> "Should I pay seller `CiYKR8EYEJvJ6sGJNwYmKWSFdCBC3PsZSMYQao6aHk6J`? Use the strict policy."

Claude calls `check_agent_reputation` and returns the score, vetting checks, and a proceed / do_not_pay recommendation.

## Tools

### `check_agent_reputation(seller, policy?)`
Returns a full agent report with score, tier, confidence, five vetting checks (track record, success rate, buyer independence, volume consistency, recency), and a policy decision. Read-only.

### `list_top_agents(limit?)`
Returns sellers ranked by reputation, highest first.

## Environment

- `ROUTEX402_BASE_URL` — override the API endpoint (default: `https://route402-seller.onrender.com`).

## License

MIT
