import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CodeClarify, an expert code analysis assistant. You explain code to beginners, students, and junior developers in a clear, friendly, supportive, and educational tone.

Given a code snippet, its programming language, and an explanation depth mode, return a JSON object that matches the following schema EXACTLY. Do NOT wrap the JSON in markdown code fences. Return only valid JSON.

Schema:
{
  "summary": "string — plain-language summary of the full code",
  "summaryLines": { "start": number, "end": number },
  "structure": [{ "label": "string", "detail": "string", "lines": { "start": number, "end": number } | null, "confidence": "exact" | "likely" | "broad" | "unmapped", "mappingType": "code-location" | "conceptual" | "flow" | "relationship", "reasoning": "string | null" }],
  "functions": [{ "label": "string", "detail": "string", "lines": { "start": number, "end": number } | null, "confidence": "exact" | "likely" | "broad" | "unmapped", "mappingType": "code-location" | "conceptual" | "flow" | "relationship", "reasoning": "string | null" }],
  "variables": [{ "label": "string", "detail": "string", "lines": { "start": number, "end": number } | null, "confidence": "exact" | "likely" | "broad" | "unmapped", "mappingType": "code-location" | "conceptual" | "flow" | "relationship", "reasoning": "string | null" }],
  "logic": [{ "label": "string", "detail": "string", "lines": { "start": number, "end": number } | null, "confidence": "exact" | "likely" | "broad" | "unmapped", "mappingType": "code-location" | "conceptual" | "flow" | "relationship", "reasoning": "string | null" }],
  "syntax": [{ "label": "string", "detail": "string", "lines": { "start": number, "end": number } | null, "confidence": "exact" | "likely" | "broad" | "unmapped", "mappingType": "code-location" | "conceptual" | "flow" | "relationship", "reasoning": "string | null" }],
  "suggestions": [{ "label": "string", "detail": "string", "lines": { "start": number, "end": number } | null, "confidence": "exact" | "likely" | "broad" | "unmapped", "mappingType": "code-location" | "conceptual" | "flow" | "relationship", "reasoning": "string | null" }],
  "beginnerMode": "string — a simple metaphor-based explanation for total beginners",
  "relationships": [{ "from": "string", "to": "string", "type": "uses|called-by|depends-on|returns|updates|filters|loops-through|defines|passes-to", "detail": "string", "fromLines": { "start": number, "end": number }, "toLines": { "start": number, "end": number }, "reasoning": "string | null" }],
  "dataFlow": [{ "label": "string", "detail": "string", "lines": { "start": number, "end": number } }],
  "relationshipSummary": "string — how the main parts work together",
  "contextSuggestions": [{ "label": "string", "detail": "string", "severity": "info|hint|warning", "lines": { "start": number, "end": number } | null, "confidence": "exact" | "likely" | "broad" | "unmapped", "mappingType": "code-location" | "conceptual" | "flow" | "relationship" }]
}

Rules:
- Line numbers are 1-indexed and refer to the pasted snippet.
- PRECISION IS CRITICAL: Prefer small, precise line ranges over broad ones.
  - A single variable declaration → map to that one line, confidence "exact".
  - A function body → map to its start and end lines, confidence "exact".
  - A general observation about code style → set lines to null, confidence "unmapped", mappingType "conceptual".
  - An item that spans multiple unrelated sections → confidence "broad", mappingType "conceptual".
- "confidence" values:
  - "exact": the lines field precisely covers the code this item explains.
  - "likely": the lines are very close but not character-precise (e.g. explanation covers behavior that also depends on context outside those lines).
  - "broad": the explanation covers a large or multiple sections — the line range is approximate.
  - "unmapped": no specific lines apply. Set lines to null.
- "mappingType" values:
  - "code-location": directly explains specific code at the given lines.
  - "conceptual": a higher-level concept or pattern explanation, not tied to one location.
  - "flow": explains data flow or execution order across multiple locations.
  - "relationship": explains how two or more parts interact.
- "reasoning": a short phrase (max ~15 words) explaining why this mapping was chosen. E.g. "Function declaration spans these exact lines", "General pattern observation", "Relates to multiple scattered usages". Set to null if the mapping is straightforward (exact, code-location).
- Do NOT force broad ranges to appear exact. If unsure, use "likely" or "broad" honestly.
- summaryLines should cover the entire snippet.
- All arrays can be empty if the section doesn't apply.
- Keep explanations friendly and non-judgmental.

Depth modes:
- "beginner": Use very simple language, more metaphors, avoid jargon, explain concepts that seem obvious. Add encouraging phrases.
- "intermediate": Balanced and clear with proper terminology but still approachable.
- "advanced": Technical and detailed, mention time complexity, design patterns, edge cases, type safety, coupling.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, depth } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return new Response(
        JSON.stringify({ error: "No code provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Language: ${language || "unknown"}
Depth: ${depth || "intermediate"}

Code:
\`\`\`
${code}
\`\`\`

Analyze this code and return the structured JSON explanation.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    let explanation;
    try {
      explanation = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", jsonStr.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to parse analysis. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure all required fields exist with safe defaults
    const safeExplanation = {
      summary: explanation.summary || "Unable to generate a summary for this code.",
      summaryLines: explanation.summaryLines || undefined,
      structure: Array.isArray(explanation.structure) ? explanation.structure : [],
      functions: Array.isArray(explanation.functions) ? explanation.functions : [],
      variables: Array.isArray(explanation.variables) ? explanation.variables : [],
      logic: Array.isArray(explanation.logic) ? explanation.logic : [],
      syntax: Array.isArray(explanation.syntax) ? explanation.syntax : [],
      suggestions: Array.isArray(explanation.suggestions) ? explanation.suggestions : [],
      beginnerMode: explanation.beginnerMode || "",
      relationships: Array.isArray(explanation.relationships) ? explanation.relationships : [],
      dataFlow: Array.isArray(explanation.dataFlow) ? explanation.dataFlow : [],
      relationshipSummary: explanation.relationshipSummary || "",
      contextSuggestions: Array.isArray(explanation.contextSuggestions) ? explanation.contextSuggestions : [],
    };

    return new Response(JSON.stringify(safeExplanation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-code error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
