import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenAI } from "@google/genai";

export const simulateRoundProxy = onCall(
  { secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "GEMINI_API_KEY is not configured on the server."
      );
    }

    const { prompt, userDecisions } = request.data || {};
    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "A valid prompt string must be provided."
      );
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemContext = `${prompt}\n\nUSER_DECISION_PAYLOAD_JSON:\n${JSON.stringify(userDecisions || {})}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: systemContext }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              totalCost: { type: "NUMBER" },
              profit: { type: "NUMBER" },
              marketFeedback: { type: "STRING" },
              tutorFeedback: { type: "STRING" },
              decisionQuality: { type: "STRING", enum: ["Strong", "Risky", "Unstable"] },
              trajectory: { type: "STRING", enum: ["Improving", "Declining", "Unstable", "Stable", "Critical"] },
              stabilityScore: { type: "NUMBER" },
              secondaryInsights: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["totalCost", "profit", "marketFeedback", "tutorFeedback"]
          }
        },
      });

      const raw = JSON.parse(response.text || "{}");
      return raw;
    } catch (err: any) {
      console.error("Error in simulateRoundProxy:", err);
      throw new HttpsError(
        "internal",
        err?.message || "Failed to process simulation prompt with Gemini API."
      );
    }
  }
);
