import { SolanaAgentKit, KeypairWallet, type Action } from "solana-agent-kit";
import { startMcpServer } from "@solana-agent-kit/adapter-mcp";
import NFTPlugin from "@solana-agent-kit/plugin-nft"
import TokenPlugin from "@solana-agent-kit/plugin-token";

import * as dotenv from "dotenv";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

dotenv.config();

// Validate required environment variables
function validateEnvironment() {
  const requiredEnvVars = {
    SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY,
    RPC_URL: process.env.RPC_URL,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

async function main() {
  try {
    // Validate environment before proceeding
    validateEnvironment();

    // Initialize the agent with error handling
    const decodedPrivateKey = bs58.decode(
      process.env.SOLANA_PRIVATE_KEY as string
    );
    const keypair = Keypair.fromSecretKey(decodedPrivateKey);
    const keypairWallet = new KeypairWallet(
      keypair,
      process.env.RPC_URL as string
    );

    const agent = new SolanaAgentKit(keypairWallet, keypairWallet.rpcUrl, {})
      .use(TokenPlugin)
      .use(NFTPlugin);

    const mcp_actions: Record<string, Action> = {};

    for (const action of agent.actions) {
      mcp_actions[action.name] = action;
    }

    const serverOptions = {
      name: "sendai-agent",
      version: "0.0.1",
    };

  
    // Start the MCP server with stdio transport (original behavior)
    console.log("Starting MCP server with stdio transport");
    await startMcpServer(mcp_actions, agent, serverOptions);
  
  } catch (error) {
    console.error(
      "Failed to start MCP server:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();