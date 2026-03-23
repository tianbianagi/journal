import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { buildRefinePrompt } from "../../shared/prompts";

admin.initializeApp();

const ALLOWED_EMAIL = "tianbian.agi@gmail.com";

export const refine = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Verify Firebase auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.email !== ALLOWED_EMAIL) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400).json({ error: "No content provided" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Gemini API key not configured. Add GEMINI_API_KEY to functions/.env" });
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildRefinePrompt(content),
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      res.status(502).json({ error: "AI refinement failed" });
      return;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      const cleaned = rawText
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      res.json({ refined: parsed.refined || content, title: parsed.title || "", feedback: parsed.feedback || "" });
    } catch {
      res.json({ refined: rawText, title: "", feedback: "" });
    }
  } catch (err) {
    console.error("Refinement error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});
