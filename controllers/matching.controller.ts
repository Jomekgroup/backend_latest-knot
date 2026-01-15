import { Request, Response } from 'express';
import axios from 'axios';
import { supabase } from '../lib/supabase';

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { userId, targetId } = req.body;
    
    // We are now using your preferred naming convention
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!userId || !targetId) {
      return res.status(400).json({ error: "userId and targetId are required" });
    }

    if (!GEMINI_KEY) {
      return res.status(500).json({ error: "Backend error: GEMINI_API_KEY is not set." });
    }

    // 1. Fetch profiles
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [userId, targetId]);

    if (fetchError || !profiles || profiles.length < 2) {
      return res.status(404).json({ error: "Could not find both profiles in Supabase." });
    }

    const userProfile = profiles.find(p => p.id === userId);
    const targetProfile = profiles.find(p => p.id === targetId);

    // 2. Call Gemini API via Axios (Direct REST call)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const prompt = `
      Analyze matrimonial compatibility between:
      A: ${JSON.stringify(userProfile)}
      B: ${JSON.stringify(targetProfile)}
      Return ONLY valid JSON: {"score": number, "insight": "string"}.
    `;

    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    // Extracting text from the Google API response structure
    const rawText = response.data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(cleanJson);

    // 3. Save Match
    const { data: matchResult, error: saveError } = await supabase
      .from('matches')
      .insert({
        user_id: userId,
        target_id: targetId,
        compatibility_score: aiData.score,
        compatibility_insight: aiData.insight
      })
      .select()
      .single();

    if (saveError) throw saveError;

    res.json(matchResult);

  } catch (error: any) {
    console.error("Match Logic Failed:", error.response?.data || error.message);
    res.status(500).json({ error: "AI Matching failed", details: error.message });
  }
};