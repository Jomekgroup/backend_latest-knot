import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/generative-ai";
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
        error: "Could not find both profiles. Make sure the IDs exist in the profiles table." 
      });
    }

    const userProfile = profiles.find(p => p.id === userId);
    const targetProfile = profiles.find(p => p.id === targetId);

    // 2. Initialize Gemini AI
    const genAI = new GoogleGenAI(process.env.API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze the matrimonial compatibility between these two individuals:
      
      Person A: ${JSON.stringify(userProfile)}
      Person B: ${JSON.stringify(targetProfile)}

      Instructions:
      1. Provide a compatibility score between 0 and 100.
      2. Provide a 2-sentence insight explaining why they are or aren't a match based on their values, religion, and lifestyle.
      3. Return ONLY a valid JSON object like this: 
      {"score": 85, "insight": "Both share strong Christian values and a love for travel..."}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the response (sometimes AI adds markdown code blocks)
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
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
      // We still return the AI data even if the save fails
      return res.json({ ...aiData, note: "Match calculated but not saved to DB" });
    }

    // Return the saved record (which now includes an ID and timestamp)
    res.json(savedMatch);

  } catch (error: any) {
    console.error("Internal Match Error:", error);
    res.status(500).json({ error: "Failed to process match", details: error.message });
  }
};