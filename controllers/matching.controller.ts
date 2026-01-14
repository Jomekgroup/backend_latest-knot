import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../lib/supabase";

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { userId, targetId } = req.body;

    if (!userId || !targetId) {
      return res.status(400).json({
        error: "userId and targetId are required"
      });
    }

    // 1️⃣ Fetch users (NOT profiles)
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .in("id", [userId, targetId]);

    if (fetchError || !users || users.length !== 2) {
      return res.status(404).json({
        error: "Could not find both users"
      });
    }

    const userA = users.find(u => u.id === userId);
    const userB = users.find(u => u.id === targetId);

    if (!userA || !userB) {
      return res.status(404).json({
        error: "Invalid user IDs"
      });
    }

    // 2️⃣ Gemini setup
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are a matrimonial compatibility expert.

Compare the following two people and respond ONLY with valid JSON.

Person A:
${JSON.stringify(userA)}

Person B:
${JSON.stringify(userB)}

Rules:
- Score must be between 0 and 100
- Insight must be max 2 sentences
- Output ONLY JSON
- No markdown, no explanations

Format:
{"score": number, "insight": string}
`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // 3️⃣ Safe JSON extraction
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const aiData = JSON.parse(jsonMatch[0]);

    // 4️⃣ Save match (CORRECT COLUMN NAMES)
    const { data: savedMatch, error: saveError } = await supabase
      .from("matches")
      .insert({
        user_id: userId,
        matched_user_id: targetId,
        compatibility_score: aiData.score,
        compatibility_insight: aiData.insight
      })
      .select()
      .single();

    if (saveError) {
      console.error("Match Save Error:", saveError);
      return res.json({
        score: aiData.score,
        insight: aiData.insight,
        saved: false
      });
    }

    return res.json(savedMatch);

  } catch (error: any) {
    console.error("Match Controller Error:", error);
    return res.status(500).json({
      error: "Failed to process match",
      message: error.message
    });
  }
};
