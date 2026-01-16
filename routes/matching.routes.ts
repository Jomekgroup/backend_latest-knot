import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';

const router = Router();

// 1. PRODUCTION RATE LIMITER
// Prevents a single user from draining your Groq API credits.
const matchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 15, // Limit each IP to 15 match requests per hour
  message: { error: "You've reached the matching limit. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. INITIALIZE CLIENTS
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 3. THE PRODUCTION ROUTE
router.post('/get-match', matchLimiter, async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // A. FETCH DATA IN PARALLEL (Performance optimization)
    const [userReq, candidatesReq] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('profiles').select('id, name, age, bio, interests').neq('id', userId).limit(20)
    ]);

    if (userReq.error || candidatesReq.error) {
      throw new Error("Supabase Fetch Error");
    }

    // B. AI LOGIC WITH LLAMA 3.3
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a professional marriage matchmaker.
          Analyze the candidate profiles against the primary user's values and bio.
          CRITICAL: Return ONLY a JSON object with an array named 'matches'.
          Each match must follow this schema exactly: { "id": string, "score": number, "reason": string }.`
        },
        {
          role: "user",
          content: `User: ${JSON.stringify(userReq.data)}. Candidates: ${JSON.stringify(candidatesReq.data)}.`
        }
      ],
      response_format: { type: "json_object" }, // Ensures valid JSON response
      temperature: 0.2, // Lower temperature = more consistent/logical matching
    });

    // C. SAFE PARSING & VALIDATION
    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) throw new Error("AI returned empty content");

    const aiResult = JSON.parse(rawContent);

    // D. RETURN MATCHES
    return res.status(200).json({
      success: true,
      data: aiResult.matches || []
    });

  } catch (error: any) {
    console.error("PRODUCTION ERROR [/get-match]:", error.message);
    
    // Don't leak technical details to the user in production
    return res.status(500).json({ 
      error: "Our matchmaker is currently busy. Please try again later.",
      success: false 
    });
  }
});

export default router;