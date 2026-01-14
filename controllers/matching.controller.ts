import { Request, Response } from 'express';
// Fixed: Changed from GoogleGenAI to GoogleGenerativeAI
import { GoogleGenerativeAI } from "@google/generative-ai";
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
        error: "Could not find both profiles. Ensure IDs are correct in the profiles table." 
      });
    }

    const userProfile = profiles.find(p => p.id === userId);
    const targetProfile = profiles.find(p => p.id === targetId);

    // 2. Initialize Gemini AI with correct class name
    const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze matrimonial compatibility between:
      Person A: ${JSON.stringify(userProfile)}
      Person B: ${JSON.stringify(targetProfile)}

      Instructions:
      1. Provide a compatibility score (0-100).
      2. Provide a 2-sentence insight on values, religion, and lifestyle.
      3. Return ONLY a valid JSON object. Do not include markdown formatting.
      Example format: {"score": 85, "insight": "Example text..."}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Improved JSON cleaning: Removes markdown blocks, backticks, and whitespace
    const cleanedJson = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    
    const aiData = JSON.parse(cleanedJson);

    // 3. Save the match result to the database
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
      console.error("Database Save Error:", saveError);
      // Fallback: return AI data if database insert fails
      return res.json({ 
        ...aiData, 
        id: 'temp-id', 
        note: "Result calculated but failed to save to history." 
      });
    }

    res.json(savedMatch);

  } catch (error: any) {
    console.error("Internal Match Error:", error);
    res.status(500).json({ error: "Failed to process match", details: error.message });
  }
};