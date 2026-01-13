
import { Request, Response } from 'express';
import { GoogleGenAI, Type } from "@google/genai";

// Fixed: Use 'any' for req and res to bypass incorrect type definitions for body, json, and status members.
export const getCompatibility = async (req: any, res: any) => {
  const { userProfile, matchProfile } = req.body;
  
  // Initialize AI client using the direct process.env.API_KEY string as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const model = 'gemini-3-pro-preview';

  const prompt = `
    Compare these two marriage-seeking profiles:
    User: ${JSON.stringify(userProfile)}
    Match: ${JSON.stringify(matchProfile)}
    
    Provide a compatibility score (0-100) and a 2-sentence insight.
  `;

  try {
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

    // Fixed: Accessed response.text directly as a property, ensuring no function call occurs.
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: "AI matching failed" });
  }
};
