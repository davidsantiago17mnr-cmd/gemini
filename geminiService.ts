
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationResult, ActivityType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const ACTIVITY_PROMPTS: Record<ActivityType, string> = {
  PILLS: "Analyze if this image shows a person taking medication or holding a pill/medicine bottle ready to be consumed.",
  WATER: "Analyze if this image shows a person drinking water from a glass, bottle, or holding a water container.",
  FOOD: "Analyze if this image shows a person eating a meal or a plate of food prepared to be eaten.",
  EXERCISE: "Analyze if this image shows a person performing light exercises, walking, or wearing sports gear."
};

export async function verifyActivityPhoto(
  base64Image: string,
  activity: ActivityType
): Promise<VerificationResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `${ACTIVITY_PROMPTS[activity]} 
  Check carefully. Respond ONLY in JSON format.
  Verification must be strict to ensure the safety of an elderly person.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["verified", "reason", "confidence"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      verified: result.verified ?? false,
      reason: result.reason ?? "No description provided.",
      confidence: result.confidence ?? 0
    };
  } catch (error) {
    console.error("AI Verification failed:", error);
    return { verified: false, reason: "Error contacting AI service.", confidence: 0 };
  }
}
