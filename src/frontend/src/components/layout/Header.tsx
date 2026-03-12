import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ClipboardList,
  Moon,
  Sun,
  User,
  UserPlus,
} from "lucide-react";
import { useTheme } from "next-themes";

interface HeaderProps {
  moduleName: string;
}

export default function Header({ moduleName }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border flex-shrink-0 gap-4">
      {/* Left: App name + module */}
      <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
        <h1 className="font-display font-semibold text-foreground text-lg whitespace-nowrap">
          EdUnite Academy
        </h1>
        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground font-medium whitespace-nowrap">
          {moduleName}
        </span>
      </div>

      {/* Centre: Quick-add toolbar */}
      <div className="flex items-center gap-2 flex-1 justify-center">
        <button
          type="button"
          data-ocid="header.add_student_button"
          onClick={() =>
            navigate({ to: "/students", search: { quickAdd: "true" } as never })
          }
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors whitespace-nowrap"
        >
          <UserPlus size={13} strokeWidth={2} />+ Student
        </button>
        <button
          type="button"
          data-ocid="header.add_behavior_button"
          onClick={() =>
            navigate({ to: "/behavior", search: { quickLog: "true" } as never })
          }
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors whitespace-nowrap"
        >
          <AlertCircle size={13} strokeWidth={2} />+ Behavior
        </button>
        <button
          type="button"
          data-ocid="header.add_assignment_button"
          onClick={() =>
            navigate({
              to: "/curriculum",
              search: { quickAdd: "true" } as never,
            })
          }
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors whitespace-nowrap"
        >
          <ClipboardList size={13} strokeWidth={2} />+ Assignment
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ml-1"
          style={{ backgroundColor: "oklch(0.48 0.22 293)" }}
        >
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
