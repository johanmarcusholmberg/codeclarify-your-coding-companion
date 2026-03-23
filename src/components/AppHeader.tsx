import { BookOpen } from "lucide-react";

const AppHeader = () => {
  return (
    <header className="w-full border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">
            CodeClarify
          </span>
        </div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors">
            About
          </span>
          <span className="px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors">
            Examples
          </span>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
