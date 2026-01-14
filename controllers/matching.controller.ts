import { Request, Response } from 'express';
// Fixed: Using the latest official unified SDK
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabase';

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { userId, targetId } = req.body;

    if (!userId || !targetId) {
      return res.status(400).json({ error: "userId and targetId are required" });
    }

    // 1. Fetch both profiles from Supabase
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [userId, targetId]);

    if (fetchError || !profiles || profiles.length < 2) {
      return res.status(404).json({ 
        error: "Profiles not found. Make sure both IDs exist in the profiles table." 
      });
    }

    const userProfile = profiles.find(p => p.id === userId);
    const targetProfile = profiles.find(p => p.id === targetId);

    // 2. Initialize Gemini AI with the new unified Client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const prompt = `
      Analyze matrimonial compatibility between:
      Person A: ${JSON.stringify(userProfile)}
      Person B: ${JSON.stringify(targetProfile)}

      Instructions:
      1. Provide a score (0-100).
      2. Provide a 2-sentence insight.
      3. Return ONLY a valid JSON object: {"score": 85, "insight": "..."}
    `;

    // New SDK Method: models.generateContent
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = response.text || "{}";
    
    // Clean and Parse JSON
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(cleanedJson);

    // 3. Save to Supabase
    const { data: savedMatch, error: saveError } = await supabase
      .from('matches')
      .insert({
        user_id: userId,
        target_id: targetId,
        compatibility_score: aiData.score,
        compatibility_insight: aiData.insight
      })
      .select()
      .single();

    if (saveError) {
      console.error("Supabase Save Error:", saveError);
      return res.json({ ...aiData, note: "Calculated but not saved." });
    }

    res.json(savedMatch);

  } catch (error: any) {
    console.error("Match Error:", error);
    res.status(500).json({ error: "Matching failed", details: error.message });
  }
};