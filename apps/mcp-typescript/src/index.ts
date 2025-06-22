import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0"
});

// Add an addition tool
server.registerTool("add_numbers_typescript",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);



// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();

// Wrap in immediately invoked async function to avoid top-level await
(async () => {
  await server.connect(transport);
  console.log("MCP server is running...");
})().catch(err => console.error("Error connecting TypeScript MCP:", err));