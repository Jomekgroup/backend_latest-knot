import { Request, Response } from 'express';
import { GoogleGenAI, Type } from "@google/genai";

// Ensure the function name is exactly 'getMatches'
export const getMatches = async (req: Request, res: Response) => {
  try {
    const { userProfile, matchProfile } = req.body;

    if (!userProfile || !matchProfile) {
      return res.status(400).json({ error: "Missing profiles in request body" });
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';

    const prompt = `
      Compare these two marriage-seeking profiles:
      User: ${JSON.stringify(userProfile)}
      Match: ${JSON.stringify(matchProfile)}
      Provide a compatibility score (0-100) and a 2-sentence insight.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            insight: { type: Type.STRING }
          },
          required: ["score", "insight"]
        }
      }
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));

  } catch (error: any) {
    console.error("AI matching failed:", error);
    res.status(500).json({ error: "AI matching failed", details: error.message });
  }
};