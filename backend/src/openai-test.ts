// OPTIONAL EXTERNAL SCRIPT
// This file requires OpenAI API key and network access.
// It is NOT part of the core local-first governance workflow.
// The core system works completely offline with synthetic data only.

import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  const response = await client.responses.create({
    model: "gpt-5.4",
    input: "Say exactly: OpenAI connection working."
  });

  console.log(response.output_text);
}

main().catch(console.error);