/** Structured explanation data model — designed for future API replacement */

/** Line range for code-to-explanation mapping. 1-indexed, inclusive. */
export interface LineRange {
  start: number;
  end: number;
}

/** How confidently the explanation maps to a specific code location */
export type MappingConfidence = "exact" | "likely" | "broad" | "unmapped";

export interface ExplanationItem {
  label: string;
  detail: string;
  /** Lines in the original code this item relates to */
  lines?: LineRange;
  /** How confident the mapping is — defaults to "exact" when lines exist, "unmapped" when not */
  confidence?: MappingConfidence;
}

/** Relationship tag types for visual badges */
export type RelationshipType =
  | "uses"
  | "called-by"
  | "depends-on"
  | "returns"
  | "updates"
  | "filters"
  | "loops-through"
  | "defines"
  | "passes-to";

/** A relationship between two parts of the code */
export interface Relationship {
  from: string;
  to: string;
  type: RelationshipType;
  detail: string;
  fromLines?: LineRange;
  toLines?: LineRange;
}

/** A step in the data flow through the code */
export interface DataFlowStep {
  label: string;
  detail: string;
  lines?: LineRange;
}

/** Context-aware suggestion about code relationships */
export interface ContextSuggestion {
  label: string;
  detail: string;
  severity: "info" | "hint" | "warning";
  lines?: LineRange;
}

export interface CodeExplanation {
  summary: string;
  /** Line range the summary covers (usually the full snippet) */
  summaryLines?: LineRange;
  structure: ExplanationItem[];
  functions: ExplanationItem[];
  variables: ExplanationItem[];
  logic: ExplanationItem[];
  syntax: ExplanationItem[];
  suggestions: ExplanationItem[];
  beginnerMode: string;

  // ---- Contextual intelligence layer ----
  /** How parts of the code relate to each other */
  relationships: Relationship[];
  /** How data moves through the code from input to output */
  dataFlow: DataFlowStep[];
  /** How the main sections work together */
  relationshipSummary: string;
  /** Context-aware suggestions about dependencies and clarity */
  contextSuggestions: ContextSuggestion[];
}

/** Unique key for an explanation item — used for highlight coordination */
export type ExplanationItemId = `${string}-${number}`;

export function makeItemId(
  sectionKey: string,
  itemIndex: number
): ExplanationItemId {
  return `${sectionKey}-${itemIndex}`;
}

/** Explanation depth modes */
export type DepthMode = "beginner" | "intermediate" | "advanced";

/**
 * Generate a structured explanation by calling the analyze-code edge function.
 * Falls back to mock data if the API call fails.
 */
export async function generateExplanation(
  code: string,
  language: string,
  depth: DepthMode = "intermediate"
): Promise<CodeExplanation> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("analyze-code", {
      body: { code, language, depth },
    });

    if (error) throw error;

    // Validate that we got a usable response
    if (data && typeof data === "object" && data.summary) {
      return data as CodeExplanation;
    }

    throw new Error("Invalid response shape");
  } catch (err) {
    console.warn("AI analysis failed, falling back to mock data:", err);
    // Graceful fallback to mock data
    const base = MOCK_EXPLANATIONS[language] ?? MOCK_EXPLANATIONS.javascript;
    return adaptToDepth(base, depth);
  }
}

// ---------------------------------------------------------------------------
// Depth adaptation — transforms explanation tone/detail per mode
// ---------------------------------------------------------------------------

function adaptToDepth(data: CodeExplanation, depth: DepthMode): CodeExplanation {
  if (depth === "intermediate") return data; // base data is written at intermediate level

  if (depth === "beginner") {
    return {
      ...data,
      summary: simplifyText(data.summary) + " Don't worry if some of this feels new — each section below will walk you through it step by step.",
      structure: data.structure.map(item => ({
        ...item,
        detail: simplifyText(item.detail) + " Think of this as one building block of the code.",
      })),
      functions: data.functions.map(item => ({
        ...item,
        detail: simplifyText(item.detail) + " A function is like a reusable recipe — you give it ingredients (inputs) and it produces a result (output).",
      })),
      variables: data.variables.map(item => ({
        ...item,
        detail: simplifyText(item.detail) + " A variable is like a labeled box that holds a value.",
      })),
      logic: data.logic.map(item => ({
        ...item,
        detail: simplifyText(item.detail) + " This part controls the order and conditions under which things happen.",
      })),
      syntax: data.syntax.map(item => ({
        ...item,
        detail: "🔤 " + simplifyText(item.detail) + " This is a language rule you'll see often — it becomes second nature with practice.",
      })),
      suggestions: data.suggestions.map(item => ({
        ...item,
        detail: "💡 " + simplifyText(item.detail),
      })),
      beginnerMode: data.beginnerMode,
      relationships: data.relationships.map(rel => ({
        ...rel,
        detail: simplifyText(rel.detail) + " These two parts of the code work together.",
      })),
      dataFlow: data.dataFlow.map(step => ({
        ...step,
        detail: simplifyText(step.detail) + " This is one step in how information moves through the code.",
      })),
      relationshipSummary: simplifyText(data.relationshipSummary) + " In short: the different pieces of this code are designed to work together like a team, each with its own job.",
      contextSuggestions: data.contextSuggestions
        .filter(s => s.severity !== "info") // hide low-priority for beginners
        .map(s => ({
          ...s,
          detail: simplifyText(s.detail),
        })),
    };
  }

  // Advanced mode
  return {
    ...data,
    summary: data.summary.replace(/\.$/, "") + ". From an implementation perspective, this demonstrates " + getAdvancedPattern(data) + ".",
    structure: data.structure.map(item => ({
      ...item,
      detail: technicalizeText(item.detail),
    })),
    functions: data.functions.map(item => ({
      ...item,
      detail: technicalizeText(item.detail) + " Consider the function's time complexity and side-effect profile.",
    })),
    variables: data.variables.map(item => ({
      ...item,
      detail: technicalizeText(item.detail) + " Note the scope, mutability, and lifetime of this binding.",
    })),
    logic: data.logic.map(item => ({
      ...item,
      detail: technicalizeText(item.detail) + " Consider edge cases and termination guarantees.",
    })),
    syntax: data.syntax.map(item => ({
      ...item,
      detail: technicalizeText(item.detail),
    })),
    suggestions: [
      ...data.suggestions.map(item => ({
        ...item,
        detail: technicalizeText(item.detail),
      })),
      { label: "Consider error boundaries", detail: "Production code should handle unexpected inputs and edge cases explicitly rather than relying on implicit behavior." },
      { label: "Type safety", detail: "Adding explicit type annotations or runtime checks would improve maintainability and catch bugs earlier in development." },
    ],
    beginnerMode: data.beginnerMode,
    relationships: data.relationships.map(rel => ({
      ...rel,
      detail: technicalizeText(rel.detail) + " This coupling affects testability and refactoring options.",
    })),
    dataFlow: data.dataFlow.map(step => ({
      ...step,
      detail: technicalizeText(step.detail),
    })),
    relationshipSummary: technicalizeText(data.relationshipSummary) + " Understanding these dependencies is key for refactoring, testing, and extending the code safely.",
    contextSuggestions: [
      ...data.contextSuggestions.map(s => ({
        ...s,
        detail: technicalizeText(s.detail),
      })),
      { label: "Coupling analysis", detail: "Consider whether the dependencies between these components follow the principle of least knowledge (Law of Demeter). Tight coupling here could make unit testing more difficult.", severity: "info" as const },
    ],
  };
}

function simplifyText(text: string): string {
  return text
    .replace(/\bparameter\b/gi, "input")
    .replace(/\biteration\b/gi, "loop cycle")
    .replace(/\biterate\b/gi, "go through")
    .replace(/\bimplicit(ly)?\b/gi, "automatic$1")
    .replace(/\bexplicit(ly)?\b/gi, "clear$1")
    .replace(/\binvoke[sd]?\b/gi, "call$&".replace("invoke", ""))
    .replace(/\bmutable\b/gi, "changeable")
    .replace(/\bimmutable\b/gi, "unchangeable")
    .replace(/\baggregate\b/gi, "combine")
    .replace(/\binstantiat/gi, "creat")
    .replace(/\bboolean\b/gi, "true/false value")
    .replace(/\bcallback\b/gi, "function passed as input");
}

function technicalizeText(text: string): string {
  return text
    .replace(/\bgoes through\b/gi, "iterates over")
    .replace(/\bpulls?\b/gi, "extracts")
    .replace(/\bfeeds?\b/gi, "passes")
    .replace(/\bbuilds?\b/gi, "constructs")
    .replace(/\bwrapped?\b/gi, "interpolated")
    .replace(/\bpieces?\b/gi, "components")
    .replace(/\bjob\b/gi, "responsibility");
}

function getAdvancedPattern(data: CodeExplanation): string {
  const hasLoop = data.logic.some(l => /loop|iterat|forEach|for\b|while/i.test(l.label + l.detail));
  const hasBranch = data.logic.some(l => /condition|ternary|if|branch|switch/i.test(l.label + l.detail));
  const hasFunctions = data.functions.length > 0;

  if (hasLoop && hasFunctions) return "functional iteration with higher-order function composition";
  if (hasBranch) return "conditional branching with data-dependent control flow";
  if (hasFunctions) return "procedural abstraction through function decomposition";
  return "structured composition of declarative and imperative patterns";
}

// ---------------------------------------------------------------------------
// Rich mock data per language — now with line ranges
// ---------------------------------------------------------------------------

const MOCK_EXPLANATIONS: Record<string, CodeExplanation> = {
  javascript: {
    summary:
      "This snippet defines a reusable greeting function and then calls it for each person in a list. It's a clean example of how to combine functions with array iteration in JavaScript.",
    summaryLines: { start: 1, end: 8 },
    structure: [
      { label: "Function definition (lines 1–5)", detail: "A function called `greet` is declared. It takes one input, builds a greeting string, logs it, and returns it.", lines: { start: 1, end: 5 } },
      { label: "Data & iteration (lines 7–8)", detail: "An array of names is created, and `forEach` loops through them, calling `greet` for each name.", lines: { start: 7, end: 8 } },
    ],
    functions: [
      { label: "greet(name)", detail: "Purpose: create and display a greeting. Input: a string `name`. Output: the greeting string. Side effect: logs the message to the console.", lines: { start: 1, end: 5 } },
    ],
    variables: [
      { label: "message", detail: 'A `const` string built with a template literal. Holds the formatted greeting like "Hello, Alice!".', lines: { start: 2, end: 2 } },
      { label: "users", detail: "A `const` array of three strings — the names of people to greet.", lines: { start: 7, end: 7 } },
    ],
    logic: [
      { label: "forEach iteration", detail: "The code loops through every element of the `users` array and runs the `greet` function once per name.", lines: { start: 8, end: 8 } },
    ],
    syntax: [
      { label: "Template literal  `…${expr}…`", detail: "Backtick strings let you embed variables directly inside the text using ${…}.", lines: { start: 2, end: 2 } },
      { label: "Arrow function  (user) => …", detail: "A shorter way to write a function. The part before => is the parameter, and the part after is the body.", lines: { start: 8, end: 8 } },
      { label: "const", detail: "Declares a variable that cannot be reassigned.", lines: { start: 2, end: 2 } },
    ],
    suggestions: [
      { label: "Add a return value check", detail: 'If `name` were undefined or empty, the greeting would read "Hello, !". Consider adding a default.', lines: { start: 1, end: 1 } },
      { label: "Use map instead of forEach", detail: "If you wanted to collect all greetings into a new array, `users.map(greet)` would be more expressive.", lines: { start: 8, end: 8 } },
      { label: "Add a comment", detail: "A short comment above the function explaining its purpose would help future readers.", lines: { start: 1, end: 1 } },
    ],
    beginnerMode:
      'Think of the `greet` function like a greeting card machine: you feed in a name, it prints a card that says "Hello, [name]!", shows it to you (console.log), and hands you a copy (return). The code then has a list of three friends and feeds each name into the machine one at a time.',
    relationships: [
      { from: "users (line 7)", to: "forEach (line 8)", type: "loops-through", detail: "The `users` array is the data source that `forEach` iterates over — each name in the array gets processed one at a time.", fromLines: { start: 7, end: 7 }, toLines: { start: 8, end: 8 } },
      { from: "forEach (line 8)", to: "greet (line 1)", type: "called-by", detail: "Each iteration of `forEach` calls the `greet` function, passing one user name as the argument.", fromLines: { start: 8, end: 8 }, toLines: { start: 1, end: 5 } },
      { from: "name parameter", to: "message (line 2)", type: "uses", detail: "The `name` parameter received by `greet` is embedded into the template literal to build `message`.", fromLines: { start: 1, end: 1 }, toLines: { start: 2, end: 2 } },
      { from: "greet", to: "message", type: "returns", detail: "The function returns the `message` string after logging it — the caller could capture this value.", fromLines: { start: 1, end: 5 }, toLines: { start: 4, end: 4 } },
    ],
    dataFlow: [
      { label: "Input: user names", detail: "Data enters as an array of strings stored in `users`.", lines: { start: 7, end: 7 } },
      { label: "Iteration: forEach passes each name", detail: "The `forEach` method pulls one name at a time from the array and feeds it to `greet`.", lines: { start: 8, end: 8 } },
      { label: "Transform: name → message", detail: "Inside `greet`, the raw name is wrapped into a greeting string using a template literal.", lines: { start: 2, end: 2 } },
      { label: "Output: console + return", detail: "The message is printed to the console and also returned (though the return value isn't captured here).", lines: { start: 3, end: 4 } },
    ],
    relationshipSummary: "The code has a simple producer→consumer pattern. The `users` array provides data, `forEach` distributes it, and `greet` transforms each piece. The function is defined first, then reused in a loop — a foundational pattern for keeping code DRY (Don't Repeat Yourself).",
    contextSuggestions: [
      { label: "Unused return value", detail: "The `greet` function returns `message`, but `forEach` discards it. If you need the results, switch to `map` to collect them into an array.", severity: "hint", lines: { start: 8, end: 8 } },
      { label: "Hidden assumption: name is a string", detail: "The function assumes `name` is always a valid string. If the `users` array contained `null` or `undefined`, the greeting would look odd. A type check or default value would make this safer.", severity: "warning", lines: { start: 1, end: 1 } },
    ],
  },

  typescript: {
    summary: "This code defines a shape for user data (an interface) and a function that formats a user's details into a readable string.",
    summaryLines: { start: 1, end: 10 },
    structure: [
      { label: "Interface declaration (lines 1–5)", detail: "Defines the `User` type with required `name` and `age` fields, plus an optional `email` field.", lines: { start: 1, end: 5 } },
      { label: "Formatter function (lines 7–10)", detail: "A function that takes a `User` object and returns a formatted string.", lines: { start: 7, end: 10 } },
    ],
    functions: [
      { label: "formatUser(user: User): string", detail: 'Produces a human-readable summary of a user. Returns a string like "Alice (age 30) - alice@example.com".', lines: { start: 7, end: 10 } },
    ],
    variables: [
      { label: "base", detail: 'A `const` string holding the name-and-age portion, e.g. "Alice (age 30)".', lines: { start: 8, end: 8 } },
    ],
    logic: [
      { label: "Ternary conditional", detail: "The return statement checks whether `user.email` exists. If yes, email is appended; otherwise, just the base string.", lines: { start: 9, end: 9 } },
    ],
    syntax: [
      { label: "interface", detail: "Describes the shape of an object — what properties it has and their types. No runtime code is generated.", lines: { start: 1, end: 1 } },
      { label: "? (optional property)", detail: "The question mark means `email` is allowed to be missing.", lines: { start: 4, end: 4 } },
      { label: ": string (type annotation)", detail: "Tells TypeScript exactly what type a value should be.", lines: { start: 7, end: 7 } },
    ],
    suggestions: [
      { label: "Validate age", detail: 'No check for negative ages. A guard like `if (user.age < 0) throw …` would prevent confusing output.', lines: { start: 7, end: 10 } },
      { label: "Consider a class", detail: "If you need more behavior attached to User, a class with methods might be cleaner." },
    ],
    beginnerMode: "Imagine a contact card. The `interface` is the blank template — it says you need a name and age, and you can optionally add an email. The `formatUser` function reads a filled-in card aloud in a nice sentence.",
    relationships: [
      { from: "User interface", to: "formatUser parameter", type: "defines", detail: "The `User` interface acts as a contract — it guarantees that any object passed to `formatUser` will have `name`, `age`, and optionally `email`.", fromLines: { start: 1, end: 5 }, toLines: { start: 7, end: 7 } },
      { from: "user.name & user.age", to: "base", type: "uses", detail: "The `base` variable is built by reading properties from the `user` parameter.", fromLines: { start: 7, end: 7 }, toLines: { start: 8, end: 8 } },
      { from: "user.email", to: "return value", type: "returns", detail: "Whether `email` exists determines the shape of the returned string — it's a conditional dependency.", fromLines: { start: 4, end: 4 }, toLines: { start: 9, end: 9 } },
    ],
    dataFlow: [
      { label: "Input: User object", detail: "A structured object with name, age, and optional email enters the function.", lines: { start: 7, end: 7 } },
      { label: "Transform: build base string", detail: "Name and age are extracted and combined into a base display string.", lines: { start: 8, end: 8 } },
      { label: "Branch: check email", detail: "The ternary decides whether to append the email or return the base alone.", lines: { start: 9, end: 9 } },
      { label: "Output: formatted string", detail: "A single human-readable string is returned to the caller.", lines: { start: 9, end: 9 } },
    ],
    relationshipSummary: "The interface and function work as a pair: the interface defines the data contract, and the function consumes it. The optional `email` property creates a branch in the output — the function adapts its result based on what data is available.",
    contextSuggestions: [
      { label: "Interface and function are tightly coupled", detail: "The `formatUser` function only works with `User` objects. This is fine for now, but if you add more formatting functions, consider making a method on the interface/class instead.", severity: "info" },
      { label: "Optional property creates a hidden branch", detail: "The `email?` field means callers must handle two different output shapes. This is clean here but could become confusing with more optional fields.", severity: "hint", lines: { start: 4, end: 4 } },
    ],
  },

  python: {
    summary: "This script calculates the Fibonacci sequence — a famous series where each number is the sum of the two before it.",
    summaryLines: { start: 1, end: 10 },
    structure: [
      { label: "Function definition (lines 1–7)", detail: "The `fibonacci` function builds the sequence step by step inside a loop.", lines: { start: 1, end: 7 } },
      { label: "Execution (lines 9–10)", detail: "Calls the function with n=10 and prints the result.", lines: { start: 9, end: 10 } },
    ],
    functions: [
      { label: "fibonacci(n)", detail: "Generates the first `n` Fibonacci numbers. Returns a list of integers.", lines: { start: 1, end: 7 } },
    ],
    variables: [
      { label: "sequence", detail: "An initially empty list that accumulates each Fibonacci number.", lines: { start: 3, end: 3 } },
      { label: "a, b", detail: 'Track the "current" and "next" Fibonacci numbers. Start at 0 and 1.', lines: { start: 4, end: 4 } },
      { label: "result", detail: "Holds the returned list so it can be printed.", lines: { start: 9, end: 9 } },
    ],
    logic: [
      { label: "for loop with range(n)", detail: "Repeats the body `n` times, appending and advancing each iteration.", lines: { start: 5, end: 7 } },
      { label: "Tuple swap: a, b = b, a + b", detail: "Python evaluates the right side first, then assigns both at once.", lines: { start: 7, end: 7 } },
    ],
    syntax: [
      { label: "def", detail: "The keyword that starts a function definition in Python.", lines: { start: 1, end: 1 } },
      { label: "Docstring (triple quotes)", detail: "Documentation string describing what the function does.", lines: { start: 2, end: 2 } },
      { label: "_ (underscore variable)", detail: 'Convention meaning "I don\'t need this value." The loop just needs to run n times.', lines: { start: 5, end: 5 } },
    ],
    suggestions: [
      { label: "Handle edge cases", detail: "What happens if someone passes 0 or a negative number? A guard clause would help.", lines: { start: 1, end: 1 } },
      { label: "Consider a generator", detail: "For very large sequences, `yield` would produce values one at a time instead of building the entire list." },
    ],
    beginnerMode: "The Fibonacci sequence is like a chain where each link is made by adding the two links before it: 0, 1, 1, 2, 3, 5, 8… This code builds that chain piece by piece, collects the pieces in a list, and shows you the first 10.",
    relationships: [
      { from: "n parameter", to: "range(n)", type: "passes-to", detail: "The input `n` controls how many times the loop runs — it directly determines the length of the output.", fromLines: { start: 1, end: 1 }, toLines: { start: 5, end: 5 } },
      { from: "a (current value)", to: "sequence.append(a)", type: "uses", detail: "Each iteration, the current Fibonacci number `a` is added to the growing list.", fromLines: { start: 4, end: 4 }, toLines: { start: 6, end: 6 } },
      { from: "a, b swap", to: "next iteration", type: "updates", detail: "The tuple swap advances both trackers so the next loop iteration produces the next number in the sequence.", fromLines: { start: 7, end: 7 }, toLines: { start: 5, end: 5 } },
      { from: "fibonacci(10)", to: "result", type: "returns", detail: "The function call on line 9 captures the returned list in `result`, which is then printed.", fromLines: { start: 9, end: 9 }, toLines: { start: 7, end: 7 } },
    ],
    dataFlow: [
      { label: "Input: integer n", detail: "The number 10 is passed as the argument, determining how many Fibonacci numbers to generate.", lines: { start: 9, end: 9 } },
      { label: "Initialize: empty list + starting pair", detail: "An empty `sequence` list and the seed values (0, 1) are set up before the loop.", lines: { start: 3, end: 4 } },
      { label: "Loop: accumulate values", detail: "Each iteration appends the current value and shifts the pair forward.", lines: { start: 5, end: 7 } },
      { label: "Output: return + print", detail: "The completed list is returned, stored in `result`, and printed.", lines: { start: 9, end: 10 } },
    ],
    relationshipSummary: "The function is self-contained: `n` controls the loop count, `a` and `b` carry state between iterations, and `sequence` accumulates the results. The caller on line 9 simply triggers the function and displays the output — all the interesting work happens inside the loop.",
    contextSuggestions: [
      { label: "Loop variables carry hidden state", detail: "The values of `a` and `b` from one iteration feed directly into the next. This is elegant but can be confusing — a comment explaining the swap pattern would help beginners.", severity: "hint", lines: { start: 7, end: 7 } },
      { label: "No input validation", detail: "Passing a negative number or non-integer would cause unexpected behavior. The function silently returns an empty list for n=0, which might surprise callers.", severity: "warning", lines: { start: 1, end: 1 } },
    ],
  },

  html: {
    summary: "This HTML creates a simple hero section for a webpage — a heading, paragraph, and call-to-action link.",
    summaryLines: { start: 1, end: 5 },
    structure: [
      { label: "<section> wrapper", detail: 'Groups the hero content into a semantic section with the class "hero".', lines: { start: 1, end: 5 } },
      { label: "Content elements", detail: "An <h1> heading, a <p> paragraph, and an <a> link.", lines: { start: 2, end: 4 } },
    ],
    functions: [],
    variables: [],
    logic: [
      { label: 'Anchor link (#about)', detail: 'The href="#about" scrolls to the element with id="about" on the same page.', lines: { start: 4, end: 4 } },
    ],
    syntax: [
      { label: "<section>", detail: "A semantic HTML element that groups related content.", lines: { start: 1, end: 1 } },
      { label: "class attribute", detail: "Assigns CSS class names for styling.", lines: { start: 1, end: 1 } },
      { label: "<h1>", detail: "The top-level heading. Generally one per page for accessibility.", lines: { start: 2, end: 2 } },
    ],
    suggestions: [
      { label: "Add an aria-label", detail: 'Adding aria-label="Hero section" improves accessibility.', lines: { start: 1, end: 1 } },
      { label: "Use a <button> if no navigation", detail: "If the action is in-page interaction, <button> is more semantic.", lines: { start: 4, end: 4 } },
    ],
    beginnerMode: 'Think of this like a poster. The <section> is the board, <h1> is the big title, <p> is the description, and the <a> link is the "click here" button.',
    relationships: [
      { from: '<section class="hero">', to: "all child elements", type: "defines", detail: "The section acts as a container — its class name determines how all the inner elements are styled together.", fromLines: { start: 1, end: 1 }, toLines: { start: 2, end: 4 } },
      { from: '<a href="#about">', to: "external #about element", type: "depends-on", detail: "This link expects an element with id=\"about\" to exist elsewhere on the page. If it's missing, the link does nothing.", fromLines: { start: 4, end: 4 }, toLines: { start: 4, end: 4 } },
    ],
    dataFlow: [
      { label: "Static content", detail: "All content is hard-coded HTML — there's no dynamic data entering or leaving.", lines: { start: 1, end: 5 } },
      { label: "User interaction: click", detail: "When the user clicks the link, the browser scrolls to the #about section.", lines: { start: 4, end: 4 } },
    ],
    relationshipSummary: "This is a simple parent→children structure. The <section> groups and styles everything, while the link creates an implicit dependency on another part of the page (the #about element).",
    contextSuggestions: [
      { label: "External dependency: #about", detail: "The link points to an element that isn't visible in this snippet. If #about doesn't exist on the page, the link will silently fail.", severity: "warning", lines: { start: 4, end: 4 } },
    ],
  },

  css: {
    summary: "This CSS styles a card component — a white rounded box with a subtle shadow that lifts on hover.",
    summaryLines: { start: 1, end: 11 },
    structure: [
      { label: ".card base styles", detail: "Vertical flex container with padding, rounded corners, white background, and a soft shadow.", lines: { start: 1, end: 8 } },
      { label: ".card:hover state", detail: "Moves the card up by 2px on hover for a lift effect.", lines: { start: 10, end: 12 } },
    ],
    functions: [],
    variables: [],
    logic: [
      { label: "Hover interaction", detail: "The `:hover` pseudo-class activates when the cursor is over the element. The `transition` makes the movement smooth.", lines: { start: 7, end: 7 } },
    ],
    syntax: [
      { label: "display: flex", detail: "Turns the element into a flex container for layout.", lines: { start: 2, end: 2 } },
      { label: "box-shadow", detail: "Adds a shadow behind the element.", lines: { start: 6, end: 6 } },
      { label: "transition", detail: "Animates changes to the specified property over a duration.", lines: { start: 7, end: 7 } },
      { label: "translateY(-2px)", detail: "Moves the element upward by 2 pixels.", lines: { start: 11, end: 11 } },
    ],
    suggestions: [
      { label: "Add a hover shadow change", detail: "Increasing the shadow on hover would reinforce the lifted feeling.", lines: { start: 10, end: 12 } },
      { label: "Use CSS custom properties", detail: "Extracting values into variables would make the card easier to theme." },
    ],
    beginnerMode: "Imagine the card is a sticky note. Normally it sits flat. When you point at it, it floats up slightly — the shadow sells the illusion.",
    relationships: [
      { from: "transition (line 7)", to: "translateY on hover", type: "depends-on", detail: "The `transition` property on the base rule is what makes the hover transform animate smoothly instead of jumping instantly.", fromLines: { start: 7, end: 7 }, toLines: { start: 11, end: 11 } },
      { from: ".card base", to: ".card:hover", type: "defines", detail: "The hover state only modifies the transform — all other styles (padding, shadow, radius) are inherited from the base rule.", fromLines: { start: 1, end: 8 }, toLines: { start: 10, end: 12 } },
    ],
    dataFlow: [
      { label: "Cascade: base → hover", detail: "The browser applies base styles first, then overlays hover styles when the cursor enters.", lines: { start: 1, end: 12 } },
      { label: "Animation: transition bridges the gap", detail: "The transition property creates a smooth animation between the base state and hover state.", lines: { start: 7, end: 7 } },
    ],
    relationshipSummary: "The two rule blocks work as a pair: the base rule defines the card's appearance and sets up the transition, while the hover rule only changes the transform. The transition property is the bridge that makes the state change feel smooth.",
    contextSuggestions: [
      { label: "Transition targets only 'transform'", detail: "If you add more hover changes (like box-shadow), they won't animate unless you update the transition property to include them.", severity: "hint", lines: { start: 7, end: 7 } },
    ],
  },

  sql: {
    summary: "This SQL query finds the top 10 customers by total spending since 2024.",
    summaryLines: { start: 1, end: 10 },
    structure: [
      { label: "SELECT clause", detail: "Picks columns: user name, order count, and total amount.", lines: { start: 1, end: 4 } },
      { label: "FROM + JOIN", detail: "Combines `users` and `orders` tables by user ID.", lines: { start: 5, end: 6 } },
      { label: "WHERE → GROUP BY → ORDER BY → LIMIT", detail: "Filters, groups, sorts, and caps the result.", lines: { start: 7, end: 10 } },
    ],
    functions: [
      { label: "COUNT(o.id)", detail: "Counts how many order rows exist per user.", lines: { start: 3, end: 3 } },
      { label: "SUM(o.amount)", detail: "Adds up all order amounts per user.", lines: { start: 4, end: 4 } },
    ],
    variables: [
      { label: "Aliases: u and o", detail: "Short nicknames for the tables.", lines: { start: 5, end: 6 } },
      { label: "AS total_orders / total_spent", detail: "Friendly names for computed values.", lines: { start: 3, end: 4 } },
    ],
    logic: [
      { label: "LEFT JOIN", detail: "Includes every user even without orders (though WHERE filters those out).", lines: { start: 6, end: 6 } },
      { label: "WHERE filter", detail: "Only includes orders from 2024 onward.", lines: { start: 7, end: 7 } },
      { label: "GROUP BY + aggregates", detail: "Collapses rows per user into summary rows.", lines: { start: 8, end: 8 } },
    ],
    syntax: [
      { label: "SELECT … FROM", detail: "The core of every SQL query.", lines: { start: 1, end: 5 } },
      { label: "LEFT JOIN … ON", detail: "Merges tables based on matching user IDs.", lines: { start: 6, end: 6 } },
      { label: "ORDER BY … DESC", detail: "Sorts descending — largest values first.", lines: { start: 9, end: 9 } },
      { label: "LIMIT 10", detail: "Caps output to 10 rows.", lines: { start: 10, end: 10 } },
    ],
    suggestions: [
      { label: "Use INNER JOIN", detail: "The WHERE clause already filters out users without orders, so INNER JOIN makes the intent clearer.", lines: { start: 6, end: 6 } },
      { label: "Add HAVING for minimum spend", detail: "A HAVING clause could exclude low-value customers." },
    ],
    beginnerMode: "Imagine a spreadsheet of customers and another of purchases. This query looks up each customer, totals their spending in 2024, and shows the top 10 biggest spenders — like a leaderboard.",
    relationships: [
      { from: "users table (u)", to: "orders table (o)", type: "depends-on", detail: "The JOIN connects each user to their orders using the shared `user_id` column — without this link, the query can't match spending to people.", fromLines: { start: 5, end: 5 }, toLines: { start: 6, end: 6 } },
      { from: "WHERE filter", to: "GROUP BY", type: "filters", detail: "The WHERE clause runs before grouping — it narrows down which orders are included before any counting or summing happens.", fromLines: { start: 7, end: 7 }, toLines: { start: 8, end: 8 } },
      { from: "GROUP BY u.name", to: "COUNT & SUM", type: "defines", detail: "Grouping by user name creates the \"buckets\" that the aggregate functions (COUNT, SUM) operate within.", fromLines: { start: 8, end: 8 }, toLines: { start: 3, end: 4 } },
      { from: "ORDER BY total_spent", to: "LIMIT 10", type: "depends-on", detail: "The ORDER BY sorts all results by spending, then LIMIT picks only the top 10 — the order determines which rows survive.", fromLines: { start: 9, end: 9 }, toLines: { start: 10, end: 10 } },
    ],
    dataFlow: [
      { label: "Source: two tables", detail: "Data starts in `users` and `orders` — two separate pools of information.", lines: { start: 5, end: 6 } },
      { label: "Join: match users to orders", detail: "The LEFT JOIN combines rows where user IDs match.", lines: { start: 6, end: 6 } },
      { label: "Filter: 2024+ only", detail: "The WHERE clause removes older orders before any calculations.", lines: { start: 7, end: 7 } },
      { label: "Aggregate: count & sum per user", detail: "GROUP BY collapses rows; COUNT and SUM compute per-user totals.", lines: { start: 3, end: 4 } },
      { label: "Output: sorted top 10", detail: "Results are sorted by spending and capped at 10 rows.", lines: { start: 9, end: 10 } },
    ],
    relationshipSummary: "This query follows a pipeline: two tables are joined, filtered, grouped into per-user summaries, sorted, and trimmed. Each clause depends on the one before it — the WHERE narrows data before GROUP BY creates buckets, and ORDER BY must finish before LIMIT can pick the top rows.",
    contextSuggestions: [
      { label: "LEFT JOIN contradicts WHERE", detail: "The LEFT JOIN includes users without orders, but the WHERE clause on `o.created_at` immediately filters them out. An INNER JOIN would be clearer and slightly more efficient.", severity: "warning", lines: { start: 6, end: 7 } },
      { label: "Column alias used in ORDER BY", detail: "Using the alias `total_spent` in ORDER BY works in most databases but isn't universal. Some engines require the full expression.", severity: "info", lines: { start: 9, end: 9 } },
    ],
  },

  java: {
    summary: "This Java program defines a Calculator class with an add method, then runs it from main to print the sum of 5 and 3.",
    summaryLines: { start: 1, end: 8 },
    structure: [
      { label: "Class declaration", detail: "Everything lives inside the `Calculator` class.", lines: { start: 1, end: 8 } },
      { label: "Two static methods", detail: "`add` performs the calculation; `main` is the entry point.", lines: { start: 2, end: 7 } },
    ],
    functions: [
      { label: "add(int a, int b) → int", detail: "Takes two integers, returns their sum.", lines: { start: 2, end: 4 } },
      { label: "main(String[] args)", detail: "The entry point. Calls add and prints the result.", lines: { start: 6, end: 8 } },
    ],
    variables: [
      { label: "a, b", detail: "Integer parameters passed into the add method.", lines: { start: 2, end: 2 } },
      { label: "result", detail: "Stores the return value of add(5, 3).", lines: { start: 7, end: 7 } },
    ],
    logic: [
      { label: "Linear flow", detail: "The program runs top-down in main: call add → store → print.", lines: { start: 6, end: 8 } },
    ],
    syntax: [
      { label: "public static", detail: "`public` = accessible anywhere; `static` = belongs to the class itself.", lines: { start: 2, end: 2 } },
      { label: "System.out.println", detail: "Java's built-in way to print to the console.", lines: { start: 8, end: 8 } },
      { label: "String[] args", detail: "Command-line arguments. Not used here but required by Java.", lines: { start: 6, end: 6 } },
    ],
    suggestions: [
      { label: "Add more operations", detail: "Extend with subtract, multiply, divide for a complete calculator." },
      { label: "Handle division by zero", detail: "A divide method should check for zero to prevent crashes." },
    ],
    beginnerMode: 'This is a tiny calculator app with one button — add. The `main` part turns it on, presses add with 5 and 3, and shows "Result: 8".',
    relationships: [
      { from: "main (line 6)", to: "add (line 2)", type: "called-by", detail: "The `main` method calls `add(5, 3)` — this is the only connection between the two methods. Main is the consumer, add is the producer.", fromLines: { start: 7, end: 7 }, toLines: { start: 2, end: 4 } },
      { from: "add return value", to: "result variable", type: "returns", detail: "The integer returned by `add` is captured in `result`, which is then printed.", fromLines: { start: 3, end: 3 }, toLines: { start: 7, end: 7 } },
      { from: "result", to: "System.out.println", type: "passes-to", detail: "The stored result is passed to println for display — this is the final step in the data chain.", fromLines: { start: 7, end: 7 }, toLines: { start: 8, end: 8 } },
    ],
    dataFlow: [
      { label: "Input: literal values 5 and 3", detail: "The numbers are hard-coded in the main method call.", lines: { start: 7, end: 7 } },
      { label: "Process: add computes the sum", detail: "The add method receives the values and returns their sum.", lines: { start: 2, end: 4 } },
      { label: "Store: result captures the output", detail: "The return value is stored in a local variable.", lines: { start: 7, end: 7 } },
      { label: "Output: printed to console", detail: "The result is displayed using System.out.println.", lines: { start: 8, end: 8 } },
    ],
    relationshipSummary: "A simple call chain: main → add → result → println. The `add` method is a pure function (no side effects), and main orchestrates the flow from input to output. The class itself is just a container.",
    contextSuggestions: [
      { label: "Hard-coded inputs", detail: "The values 5 and 3 are baked into the code. For reusability, consider reading from `args` or user input.", severity: "hint", lines: { start: 7, end: 7 } },
    ],
  },

  csharp: {
    summary: "This C# code defines a Person class with Name and Age properties and a Greet method that returns a friendly introduction.",
    summaryLines: { start: 1, end: 9 },
    structure: [
      { label: "Class declaration", detail: "The `Person` class bundles data (Name, Age) with behavior (Greet).", lines: { start: 1, end: 9 } },
      { label: "Properties + method", detail: "Two auto-properties store data; one method produces a greeting.", lines: { start: 3, end: 8 } },
    ],
    functions: [
      { label: "Greet() → string", detail: 'Returns "Hi, I\'m Alice and I\'m 30 years old." using the object\'s own properties.', lines: { start: 6, end: 8 } },
    ],
    variables: [
      { label: "Name (string)", detail: "Auto-property storing the person's name.", lines: { start: 3, end: 3 } },
      { label: "Age (int)", detail: "Auto-property storing the person's age.", lines: { start: 4, end: 4 } },
    ],
    logic: [
      { label: "No branching", detail: "The class is straightforward — Greet always returns the same pattern." },
    ],
    syntax: [
      { label: "{ get; set; }", detail: "C# auto-property syntax. The compiler generates the backing field.", lines: { start: 3, end: 3 } },
      { label: '$"…{expr}…" (string interpolation)', detail: "Embeds expressions in curly braces, like template literals in JS.", lines: { start: 8, end: 8 } },
      { label: "public", detail: "Access modifier — visible to any code with a reference to the object.", lines: { start: 1, end: 1 } },
    ],
    suggestions: [
      { label: "Add validation", detail: "Consider throwing an exception if Name is null/empty or Age is negative.", lines: { start: 3, end: 4 } },
      { label: "Override ToString()", detail: "Overriding ToString() to call Greet() would simplify printing." },
    ],
    beginnerMode: 'Imagine a name tag at a meetup. The class is the blank tag with spaces for name and age. The Greet method reads it aloud: "Hi, I\'m Alice and I\'m 30 years old."',
    relationships: [
      { from: "Name property", to: "Greet method", type: "uses", detail: "The Greet method reads the `Name` property to build its output string — if Name changes, the greeting changes too.", fromLines: { start: 3, end: 3 }, toLines: { start: 6, end: 8 } },
      { from: "Age property", to: "Greet method", type: "uses", detail: "Similarly, `Age` is embedded in the greeting string via interpolation.", fromLines: { start: 4, end: 4 }, toLines: { start: 6, end: 8 } },
      { from: "{ get; set; }", to: "external callers", type: "defines", detail: "The auto-properties allow any outside code to read and write Name and Age — there's no protection or validation.", fromLines: { start: 3, end: 4 }, toLines: { start: 1, end: 1 } },
    ],
    dataFlow: [
      { label: "Input: set properties", detail: "External code sets Name and Age on a Person instance.", lines: { start: 3, end: 4 } },
      { label: "Transform: Greet reads properties", detail: "The method accesses the stored values and formats them into a sentence.", lines: { start: 6, end: 8 } },
      { label: "Output: greeting string", detail: "The formatted string is returned to the caller.", lines: { start: 8, end: 8 } },
    ],
    relationshipSummary: "The class follows an encapsulation pattern: properties store the state, and the method reads that state to produce output. The data flows in through property setters and out through Greet's return value. Without validation, there's an implicit trust that callers set reasonable values.",
    contextSuggestions: [
      { label: "No validation on properties", detail: "Anyone can set Name to empty string or Age to -5. Using a full property with validation would make the class more robust.", severity: "warning", lines: { start: 3, end: 4 } },
      { label: "Greet depends on mutable state", detail: "Since Name and Age can change at any time, calling Greet twice could return different results. This is expected but worth noting for beginners.", severity: "info", lines: { start: 6, end: 8 } },
    ],
  },
};
