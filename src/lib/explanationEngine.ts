/** Structured explanation data model — designed for future API replacement */

export interface ExplanationItem {
  label: string;
  detail: string;
}

export interface CodeExplanation {
  summary: string;
  structure: ExplanationItem[];
  functions: ExplanationItem[];
  variables: ExplanationItem[];
  logic: ExplanationItem[];
  syntax: ExplanationItem[];
  suggestions: ExplanationItem[];
  beginnerMode: string;
}

/**
 * Generate a mock explanation for the given language.
 * Replace this function body with a real API call later.
 */
export function generateExplanation(
  _code: string,
  language: string
): Promise<CodeExplanation> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_EXPLANATIONS[language] ?? MOCK_EXPLANATIONS.javascript);
    }, 1400);
  });
}

// ---------------------------------------------------------------------------
// Rich mock data per language
// ---------------------------------------------------------------------------

const MOCK_EXPLANATIONS: Record<string, CodeExplanation> = {
  javascript: {
    summary:
      "This snippet defines a reusable greeting function and then calls it for each person in a list. It's a clean example of how to combine functions with array iteration in JavaScript.",
    structure: [
      {
        label: "Function definition (lines 1–5)",
        detail:
          "A function called `greet` is declared. It takes one input, builds a greeting string, logs it, and returns it.",
      },
      {
        label: "Data & iteration (lines 7–8)",
        detail:
          "An array of names is created, and `forEach` loops through them, calling `greet` for each name.",
      },
    ],
    functions: [
      {
        label: "greet(name)",
        detail:
          "Purpose: create and display a greeting. Input: a string `name`. Output: the greeting string. Side effect: logs the message to the console.",
      },
    ],
    variables: [
      {
        label: "message",
        detail:
          "A `const` string built with a template literal. Holds the formatted greeting like \"Hello, Alice!\".",
      },
      {
        label: "users",
        detail:
          "A `const` array of three strings — the names of people to greet.",
      },
    ],
    logic: [
      {
        label: "forEach iteration",
        detail:
          "The code loops through every element of the `users` array and runs the `greet` function once per name. There's no early exit — every user gets greeted.",
      },
    ],
    syntax: [
      {
        label: "Template literal  `…${expr}…`",
        detail:
          "Backtick strings let you embed variables directly inside the text using ${…}. Much easier to read than string concatenation with +.",
      },
      {
        label: "Arrow function  (user) => …",
        detail:
          "A shorter way to write a function. The part before => is the parameter, and the part after is the body.",
      },
      {
        label: "const",
        detail:
          "Declares a variable that cannot be reassigned. The value itself (like an array) can still be modified internally, but the variable always points to the same thing.",
      },
    ],
    suggestions: [
      {
        label: "Add a return value check",
        detail:
          "If `name` were undefined or empty, the greeting would read \"Hello, !\". Consider adding a default: `name = name || 'friend'`.",
      },
      {
        label: "Use map instead of forEach",
        detail:
          "If you wanted to collect all greetings into a new array, `users.map(greet)` would be more expressive than forEach.",
      },
      {
        label: "Add a comment",
        detail:
          "A short comment above the function explaining its purpose would help future readers understand the code faster.",
      },
    ],
    beginnerMode:
      "Think of the `greet` function like a greeting card machine: you feed in a name, it prints a card that says \"Hello, [name]!\", shows it to you (console.log), and hands you a copy (return). The code then has a list of three friends and feeds each name into the machine one at a time.",
  },

  typescript: {
    summary:
      "This code defines a shape for user data (an interface) and a function that formats a user's details into a readable string. It demonstrates TypeScript's type system and optional properties.",
    structure: [
      {
        label: "Interface declaration (lines 1–5)",
        detail:
          "Defines the `User` type with required `name` and `age` fields, plus an optional `email` field.",
      },
      {
        label: "Formatter function (lines 7–10)",
        detail:
          "A function that takes a `User` object and returns a formatted string, conditionally including the email.",
      },
    ],
    functions: [
      {
        label: "formatUser(user: User): string",
        detail:
          "Purpose: produce a human-readable summary of a user. Input: a User object. Output: a string like \"Alice (age 30) - alice@example.com\" or \"Alice (age 30)\" if no email is provided.",
      },
    ],
    variables: [
      {
        label: "base",
        detail:
          "A `const` string holding the name-and-age portion, e.g. \"Alice (age 30)\".",
      },
    ],
    logic: [
      {
        label: "Ternary conditional",
        detail:
          "The return statement checks whether `user.email` exists. If it does, the email is appended; otherwise, just the base string is returned.",
      },
    ],
    syntax: [
      {
        label: "interface",
        detail:
          "A TypeScript keyword that describes the shape of an object — what properties it has and what types they are. It doesn't produce any code at runtime.",
      },
      {
        label: "? (optional property)",
        detail:
          "The question mark after `email` means that property is allowed to be missing. Without it, every User would need an email.",
      },
      {
        label: ": string (type annotation)",
        detail:
          "Tells TypeScript (and other developers) exactly what type a variable, parameter, or return value should be.",
      },
    ],
    suggestions: [
      {
        label: "Validate age",
        detail:
          "There's no check for negative ages. A guard like `if (user.age < 0) throw …` could prevent confusing output.",
      },
      {
        label: "Consider a class",
        detail:
          "If you need more behavior attached to User (e.g. greeting, serialization), a class with methods might be cleaner than a standalone function.",
      },
    ],
    beginnerMode:
      "Imagine you're filling out a contact card. The `interface` is the blank template — it says you need a name and age, and you can optionally add an email. The `formatUser` function takes a filled-in card and reads it aloud in a nice sentence.",
  },

  python: {
    summary:
      "This script calculates the Fibonacci sequence — a famous series where each number is the sum of the two before it. It generates the first 10 numbers and prints them.",
    structure: [
      {
        label: "Function definition (lines 1–7)",
        detail:
          "The `fibonacci` function builds the sequence step by step inside a loop and returns a list.",
      },
      {
        label: "Execution (lines 9–10)",
        detail:
          "Calls the function with n=10 and prints the result.",
      },
    ],
    functions: [
      {
        label: "fibonacci(n)",
        detail:
          "Purpose: generate the first `n` Fibonacci numbers. Input: an integer `n`. Output: a list of integers like [0, 1, 1, 2, 3, 5, 8, 13, 21, 34].",
      },
    ],
    variables: [
      {
        label: "sequence",
        detail: "An initially empty list that accumulates each Fibonacci number as the loop runs.",
      },
      {
        label: "a, b",
        detail:
          "Two variables that track the \"current\" and \"next\" Fibonacci numbers. They start at 0 and 1 and are swapped each iteration.",
      },
      {
        label: "result",
        detail: "Holds the returned list so it can be printed.",
      },
    ],
    logic: [
      {
        label: "for loop with range(n)",
        detail:
          "Repeats the body exactly `n` times. Each time, it appends the current value and advances the pair (a, b) to the next two Fibonacci numbers.",
      },
      {
        label: "Tuple swap: a, b = b, a + b",
        detail:
          "Python evaluates the right side first, then assigns both at once. This avoids needing a temporary variable.",
      },
    ],
    syntax: [
      {
        label: "def",
        detail: "The keyword that starts a function definition in Python.",
      },
      {
        label: "Docstring (triple quotes)",
        detail:
          "The text inside triple quotes right after `def` is a documentation string. It describes what the function does and is accessible via `help(fibonacci)`.",
      },
      {
        label: "_ (underscore variable)",
        detail:
          "Using `_` as the loop variable is a Python convention meaning \"I don't need this value.\" The loop just needs to run n times.",
      },
    ],
    suggestions: [
      {
        label: "Handle edge cases",
        detail:
          "What happens if someone passes 0 or a negative number? Adding a guard clause would make the function more robust.",
      },
      {
        label: "Consider a generator",
        detail:
          "For very large sequences, `yield` would produce values one at a time instead of building the entire list in memory.",
      },
    ],
    beginnerMode:
      "The Fibonacci sequence is like a chain where each link is made by adding the two links before it: 0, 1, 1, 2, 3, 5, 8… This code builds that chain piece by piece in a loop, collects the pieces in a list, and then shows you the first 10.",
  },

  html: {
    summary:
      "This HTML creates a simple hero section for a webpage — a large heading, a short paragraph, and a call-to-action link styled as a button.",
    structure: [
      {
        label: "<section> wrapper",
        detail:
          "Groups the hero content into a semantic section with the class \"hero\" for styling.",
      },
      {
        label: "Content elements",
        detail:
          "An <h1> heading, a <p> paragraph, and an <a> link that points to the #about anchor on the same page.",
      },
    ],
    functions: [],
    variables: [],
    logic: [
      {
        label: "Anchor link (#about)",
        detail:
          "The href=\"#about\" makes the link scroll to the element with id=\"about\" on the same page rather than navigating away.",
      },
    ],
    syntax: [
      {
        label: "<section>",
        detail:
          "A semantic HTML element that groups related content. It helps screen readers and search engines understand the page structure.",
      },
      {
        label: "class attribute",
        detail:
          "Assigns one or more CSS class names to an element so it can be styled with a stylesheet.",
      },
      {
        label: "<h1>",
        detail:
          "The top-level heading of the page. There should generally be only one <h1> per page for good accessibility and SEO.",
      },
    ],
    suggestions: [
      {
        label: "Add an aria-label",
        detail:
          "Adding aria-label=\"Hero section\" to the <section> can improve accessibility for screen reader users.",
      },
      {
        label: "Use a <button> if no navigation",
        detail:
          "If the \"Learn More\" action triggers an in-page interaction rather than navigation, a <button> element would be more semantically correct.",
      },
    ],
    beginnerMode:
      "Think of this like a poster for a website. The <section> is the poster board, <h1> is the big title, <p> is the small description underneath, and the <a> link is the \"click here\" button that takes you further down the page.",
  },

  css: {
    summary:
      "This CSS styles a card component — a white rounded box with a subtle shadow that lifts slightly when you hover over it.",
    structure: [
      {
        label: ".card base styles",
        detail:
          "Sets up the card as a vertical flex container with padding, rounded corners, a white background, and a soft shadow.",
      },
      {
        label: ".card:hover state",
        detail:
          "Moves the card up by 2 pixels on hover to create a subtle lift effect.",
      },
    ],
    functions: [],
    variables: [],
    logic: [
      {
        label: "Hover interaction",
        detail:
          "The `:hover` pseudo-class activates only when the user's cursor is over the element. The `transition` property on the base rule makes the movement smooth rather than instant.",
      },
    ],
    syntax: [
      {
        label: "display: flex",
        detail:
          "Turns the element into a flex container so its children can be easily arranged in rows or columns.",
      },
      {
        label: "box-shadow",
        detail:
          "Adds a shadow behind the element. The values control horizontal offset, vertical offset, blur radius, and color.",
      },
      {
        label: "transition",
        detail:
          "Tells the browser to animate changes to the specified property (here, transform) over a duration with an easing function.",
      },
      {
        label: "translateY(-2px)",
        detail:
          "Moves the element upward by 2 pixels. Negative Y values go up; positive go down.",
      },
    ],
    suggestions: [
      {
        label: "Add a hover shadow change",
        detail:
          "Increasing the shadow spread on hover would reinforce the \"lifted\" feeling and make the interaction more polished.",
      },
      {
        label: "Use CSS custom properties",
        detail:
          "Extracting values like border-radius and shadow into CSS variables would make the card easier to theme across a project.",
      },
    ],
    beginnerMode:
      "Imagine the card is a sticky note on a desk. Normally it sits flat. When you point at it, it floats up just a tiny bit — the shadow gets the illusion across. The CSS rules here set the note's shape, color, and that gentle hover animation.",
  },

  sql: {
    summary:
      "This SQL query finds the top 10 customers by total spending since the start of 2024. It joins user data with their orders, groups by customer, and sorts by the amount spent.",
    structure: [
      {
        label: "SELECT clause",
        detail: "Picks the columns to display: user name, order count, and total amount.",
      },
      {
        label: "FROM + JOIN",
        detail: "Combines data from the `users` and `orders` tables using each user's ID.",
      },
      {
        label: "WHERE → GROUP BY → ORDER BY → LIMIT",
        detail:
          "Filters to 2024+ orders, groups rows by user, sorts by spending (highest first), and caps the result at 10 rows.",
      },
    ],
    functions: [
      {
        label: "COUNT(o.id)",
        detail: "An aggregate function that counts how many order rows exist for each user.",
      },
      {
        label: "SUM(o.amount)",
        detail: "Adds up all order amounts per user to get their total spending.",
      },
    ],
    variables: [
      {
        label: "Aliases: u and o",
        detail:
          "Short nicknames for the `users` and `orders` tables. Makes the query shorter and easier to read.",
      },
      {
        label: "AS total_orders / total_spent",
        detail: "Column aliases that give friendly names to the computed values in the output.",
      },
    ],
    logic: [
      {
        label: "LEFT JOIN",
        detail:
          "Includes every user even if they have no matching orders (those would show NULL). In practice, the WHERE clause filters those out here.",
      },
      {
        label: "WHERE filter",
        detail: "Only includes orders created on or after January 1, 2024.",
      },
      {
        label: "GROUP BY + aggregates",
        detail:
          "Collapses all rows for the same user into one summary row. The COUNT and SUM functions operate within each group.",
      },
    ],
    syntax: [
      {
        label: "SELECT … FROM",
        detail: "The core of every SQL query — choose which columns you want and which table to read from.",
      },
      {
        label: "LEFT JOIN … ON",
        detail: "Merges two tables row-by-row based on a matching condition (here, user IDs).",
      },
      {
        label: "ORDER BY … DESC",
        detail: "Sorts results. DESC means descending — largest values first.",
      },
      {
        label: "LIMIT 10",
        detail: "Caps the output to the first 10 rows after sorting.",
      },
    ],
    suggestions: [
      {
        label: "Use INNER JOIN if NULLs aren't wanted",
        detail:
          "Since the WHERE clause already filters out users without orders, switching to INNER JOIN makes the intent clearer.",
      },
      {
        label: "Add HAVING for minimum spend",
        detail:
          "A `HAVING SUM(o.amount) > 100` clause could exclude low-value customers from the leaderboard.",
      },
    ],
    beginnerMode:
      "Imagine a spreadsheet of customers and another of their purchases. This query looks up each customer, adds up how much they spent and how many orders they made in 2024, then shows you the top 10 biggest spenders — like a leaderboard.",
  },

  java: {
    summary:
      "This Java program defines a simple Calculator class with an add method, then runs it from the main method to print the sum of 5 and 3.",
    structure: [
      {
        label: "Class declaration",
        detail: "Everything lives inside the `Calculator` class — Java requires all code to be inside a class.",
      },
      {
        label: "Two static methods",
        detail: "`add` performs the calculation; `main` is the entry point that runs when the program starts.",
      },
    ],
    functions: [
      {
        label: "add(int a, int b) → int",
        detail: "Takes two integers, returns their sum. Marked `static` so it can be called without creating a Calculator object.",
      },
      {
        label: "main(String[] args)",
        detail: "The special entry point Java looks for when running the program. It calls add and prints the result.",
      },
    ],
    variables: [
      {
        label: "a, b",
        detail: "Integer parameters passed into the add method.",
      },
      {
        label: "result",
        detail: "An int variable in main that stores the return value of add(5, 3).",
      },
    ],
    logic: [
      {
        label: "Linear flow",
        detail: "The program runs top-down inside main: call add → store result → print it. No branching or loops.",
      },
    ],
    syntax: [
      {
        label: "public static",
        detail: "`public` means accessible from anywhere; `static` means it belongs to the class itself rather than an instance.",
      },
      {
        label: "System.out.println",
        detail: "Java's built-in way to print a line of text to the console.",
      },
      {
        label: "String[] args",
        detail: "Command-line arguments passed when starting the program. Not used here, but required by Java's main signature.",
      },
    ],
    suggestions: [
      {
        label: "Add more operations",
        detail: "Extend the class with subtract, multiply, and divide methods to make it a more complete calculator.",
      },
      {
        label: "Handle division by zero",
        detail: "If you add a divide method, include a check for zero to prevent a runtime crash.",
      },
    ],
    beginnerMode:
      "This is like a tiny calculator app. There's one button — add — that takes two numbers and gives you the sum. The `main` part is what happens when you turn the calculator on: it presses the add button with 5 and 3, then shows you \"Result: 8\".",
  },

  csharp: {
    summary:
      "This C# code defines a Person class with Name and Age properties and a Greet method that returns a friendly introduction string.",
    structure: [
      {
        label: "Class declaration",
        detail: "The `Person` class bundles a person's data (Name, Age) together with behavior (Greet).",
      },
      {
        label: "Properties + method",
        detail: "Two auto-properties store data; one method produces a greeting string.",
      },
    ],
    functions: [
      {
        label: "Greet() → string",
        detail: "Returns a sentence like \"Hi, I'm Alice and I'm 30 years old.\" using the object's own Name and Age.",
      },
    ],
    variables: [
      {
        label: "Name (string)",
        detail: "An auto-property with a getter and setter — stores the person's name.",
      },
      {
        label: "Age (int)",
        detail: "An auto-property storing the person's age as a whole number.",
      },
    ],
    logic: [
      {
        label: "No branching",
        detail: "The class is straightforward — no conditions or loops. Greet always returns the same pattern.",
      },
    ],
    syntax: [
      {
        label: "{ get; set; }",
        detail: "C# auto-property syntax. The compiler generates a hidden backing field automatically — no need to write it yourself.",
      },
      {
        label: "$\"…{expr}…\" (string interpolation)",
        detail: "The $ before the string lets you embed expressions in curly braces, similar to template literals in JavaScript.",
      },
      {
        label: "public",
        detail: "An access modifier meaning the member is visible to any code that has a reference to the object.",
      },
    ],
    suggestions: [
      {
        label: "Add validation",
        detail: "Consider throwing an exception if Name is null/empty or Age is negative. You could use a full property with a backing field for this.",
      },
      {
        label: "Override ToString()",
        detail: "Overriding ToString() to call Greet() would let you print a Person directly without calling .Greet() every time.",
      },
    ],
    beginnerMode:
      "Imagine a name tag at a meetup. The `Person` class is the blank tag — it has spaces for your name and age. The `Greet` method is like reading the tag out loud: \"Hi, I'm Alice and I'm 30 years old.\" You fill in the tag (set properties), then let the method do the talking.",
  },
};
