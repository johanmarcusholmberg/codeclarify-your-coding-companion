export const SAMPLE_CODE: Record<string, string> = {
  javascript: `function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

const users = ["Alice", "Bob", "Charlie"];
users.forEach(user => greet(user));`,

  typescript: `interface User {
  name: string;
  age: number;
  email?: string;
}

function formatUser(user: User): string {
  const base = \`\${user.name} (age \${user.age})\`;
  return user.email ? \`\${base} - \${user.email}\` : base;
}`,

  python: `def fibonacci(n):
    """Generate the first n Fibonacci numbers."""
    sequence = []
    a, b = 0, 1
    for _ in range(n):
        sequence.append(a)
        a, b = b, a + b
    return sequence

result = fibonacci(10)
print(result)`,

  html: `<section class="hero">
  <h1>Welcome to My Site</h1>
  <p>This is a simple landing page.</p>
  <a href="#about" class="btn">Learn More</a>
</section>`,

  css: `.card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}`,

  sql: `SELECT 
  u.name,
  COUNT(o.id) AS total_orders,
  SUM(o.amount) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= '2024-01-01'
GROUP BY u.name
ORDER BY total_spent DESC
LIMIT 10;`,

  java: `public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int result = add(5, 3);
        System.out.println("Result: " + result);
    }
}`,

  csharp: `public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public string Greet()
    {
        return $"Hi, I'm {Name} and I'm {Age} years old.";
    }
}`,
};

export const MOCK_EXPLANATION = [
  {
    title: "Overview",
    content:
      "This code defines a function called greet that takes a person's name and creates a personalized greeting message. It then uses that function to greet a list of three users one by one.",
  },
  {
    title: "Step by step",
    content:
      "First, the greet function is defined — it accepts a name, builds a message using a template string, logs it to the console, and returns it. Then an array of user names is created. Finally, the forEach method loops through each name and calls greet for each one.",
  },
  {
    title: "Key concepts",
    content:
      "Template literals (backtick strings with ${} placeholders), arrow functions (the short => syntax), and array iteration with forEach. These are foundational JavaScript patterns you'll see everywhere.",
  },
  {
    title: "Tip",
    content:
      "Template literals make it easy to embed variables inside strings without awkward concatenation. They're one of the most useful features added to modern JavaScript.",
  },
];
