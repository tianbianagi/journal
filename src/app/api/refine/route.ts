import { NextRequest, NextResponse } from "next/server";
import { buildRefinePrompt } from "../../../../shared/prompts";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ALLOWED_EMAIL = "tianbian.agi@gmail.com";

async function verifyFirebaseToken(token: string): Promise<{ email: string } | null> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const user = data.users?.[0];
    if (!user?.email) return null;
    return { email: user.email };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const user = await verifyFirebaseToken(token);
  if (!user || user.email !== ALLOWED_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
      return NextResponse.json({ error: "AI refinement failed" }, { status: 502 });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ refined: parsed.refined || content, title: parsed.title || "", feedback: parsed.feedback || "" });
    } catch {
      return NextResponse.json({ refined: rawText, title: "", feedback: "" });
    }
  } catch (err) {
    console.error("Refinement error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
