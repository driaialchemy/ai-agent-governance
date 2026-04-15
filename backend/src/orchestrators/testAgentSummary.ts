// OPTIONAL EXTERNAL SCRIPT
// This file requires OpenAI API key and network access.
// It is NOT part of the core local-first governance workflow.
// The core system works completely offline with synthetic data only.

import OpenAI from "openai";
import dotenv from "dotenv";
import { getAgentById, getVersionsByAgentId } from "../lib/registryLookup";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function run() {
  const agentId = "agent-001";

  const agent = getAgentById(agentId);
  const versions = getVersionsByAgentId(agentId);

  if (!agent) {
    console.error(`Agent not found: ${agentId}`);
    return;
  }

  const registryContext = {
    agent,
    versions
  };

  console.log("Local agent loaded successfully.");
  console.log(JSON.stringify(registryContext, null, 2));
  console.log("");
  console.log("Sending local registry context to OpenAI...");
  console.log("");

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are a helpful assistant for an AI agent registry prototype. Read local synthetic registry data and provide a short governance-focused summary."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Summarize this agent and its versions in plain English. " +
              "Include: purpose, current status, approval risk, and what should happen next before promotion.\n\n" +
              JSON.stringify(registryContext, null, 2)
          }
        ]
      }
    ]
  });

  console.log("OpenAI summary:");
  console.log("");
  console.log(response.output_text);
}

run().catch((error) => {
  console.error("Orchestrator test failed.");
  console.error(error);
});