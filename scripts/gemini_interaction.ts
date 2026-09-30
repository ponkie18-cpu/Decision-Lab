import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function runInteraction() {
  const prompt = process.env.GEMINI_PROMPT || "Summarize recent developments in generative AI decision intelligence.";

  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    tools: [
      { type: "google_search" }
    ],
    generation_config: {
      temperature: 1,
      max_output_tokens: 65536,
      top_p: 0.95,
      thinking_level: "high"
    }
  });

  console.log("Interaction ID:", interaction.id);
  console.log("Status:", interaction.status);

  // Extract the text output from interaction response
  const interactionData = interaction as any;
  const lastStep = interactionData.steps?.at(-1);
  console.log("Last step type:", lastStep?.type);
  if (lastStep?.type === "model_output") {
    const textPart = lastStep.content?.find((c: any) => c.type === "text");
    console.log("Output Text:\n", textPart?.text);
  } else {
    console.log("Last step payload:\n", JSON.stringify(lastStep, null, 2));
  }
}

runInteraction().catch(err => {
  console.error("Error running interaction:", err);
});
