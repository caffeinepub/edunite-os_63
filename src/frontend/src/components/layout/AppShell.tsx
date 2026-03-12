import { useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  LayoutGrid,
  LogIn,
  MessageSquare,
  Target,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAppUI } from "../../context/AppUIContext";
import { useStudentContext } from "../../context/StudentContextProvider";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import StudentContextPanel from "../studentContext/StudentContextPanel";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

const MODULE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/curriculum": "Curriculum",
  "/classes": "Classes",
  "/behavior": "Behavior",
  "/calendar": "Calendar",
  "/analytics": "Analytics",
  "/progress-reports": "Progress Reports",
  "/settings": "Settings",
  "/timetable": "Timetable",
};

// Routes that have full sub-paths that should be treated differently
const MODULE_NAMES_FULL: Record<string, string> = {
  "/behavior/serious-incident": "Serious Incident Report",
};

// Routes where the page fills the viewport exactly (no page-level scroll)
const VIEWPORT_CONSTRAINED_ROUTES = ["/calendar", "/curriculum"];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Curriculum-First Design",
    description:
      "Build units, modules, and assessments once. Everything else updates automatically.",
  },
  {
    icon: LayoutGrid,
    title: "Live Gradebook",
    description:
      "Color-coded grade cells, category weighting, and period-by-period tracking.",
  },
  {
    icon: AlertTriangle,
    title: "Behavior Tracking",
    description:
      "Deep categorization, pattern detection, and parent correspondence logging.",
  },
  {
    icon: BarChart3,
    title: "Analytics & At-Risk",
    description:
      "Combined risk scores from behavior, attendance, grades, and support plans.",
  },
  {
    icon: MessageSquare,
    title: "Parent Communication",
    description:
      "Message threading, templates, scheduled sending, and weekly digests.",
  },
  {
    icon: Target,
    title: "Standards Mastery",
    description:
      "Tag curriculum to CCSS and NGSS. Track mastery per student automatically.",
  },
];

function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F8F8FC" }}
    >
      {/* Nav bar */}
      <nav
        className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ backgroundColor: "#F8F8FC" }}
      >
        <div className="flex items-center gap-3">
          {/* SVG App Logo */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "#6D28D9" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <span
            className="font-semibold text-base tracking-tight"
            style={{ color: "#1a1a2e" }}
          >
            EdUnite OS
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#EDE9FE", color: "#6D28D9" }}
          >
            Class Edition
          </span>
        </div>
        <button
          type="button"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="login.primary_button"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
          style={{ backgroundColor: "#6D28D9" }}
          onMouseEnter={(e) => {
            if (!isLoggingIn)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#5B21B6";
          }}
          onMouseLeave={(e) => {
            if (!isLoggingIn)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#6D28D9";
          }}
        >
          {isLoggingIn ? (
            <svg
              className="animate-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <LogIn size={14} />
          )}
          {isLoggingIn ? "Signing in…" : "Sign in"}
        </button>
      </nav>

      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-24"
        style={
          {
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, #ede9fe 0%, transparent 70%)",
          } as React.CSSProperties
        }
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8 border"
          style={{
            backgroundColor: "#EDE9FE",
            color: "#6D28D9",
            borderColor: "#DDD6FE",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "#6D28D9" }}
          />
          Unified K–12 Classroom Operating System
        </div>

        {/* Large SVG logo mark */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-xl"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            boxShadow: "0 20px 60px rgba(109,40,217,0.3)",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>

        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6 max-w-3xl"
          style={{ color: "#0f0a1e" }}
        >
          Build curriculum once.
          <br />
          <span style={{ color: "#6D28D9" }}>Everything flows.</span>
        </h1>
        <p
          className="text-lg leading-relaxed max-w-2xl mb-10"
          style={{ color: "#4a4a6a" }}
        >
          EdUnite OS is a unified classroom operating system where curriculum
          drives your gradebook, analytics, reports, and parent communication —
          automatically.
        </p>

        <button
          type="button"
          onClick={login}
          disabled={isLoggingIn}
          className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 shadow-lg"
          style={{
            backgroundColor: "#6D28D9",
            boxShadow: "0 8px 32px rgba(109,40,217,0.35)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#5B21B6";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#6D28D9";
          }}
        >
          {isLoggingIn ? (
            <svg
              className="animate-spin"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <LogIn size={18} />
          )}
          {isLoggingIn ? "Signing in…" : "Get started — Sign in"}
        </button>
        <p className="text-xs mt-4" style={{ color: "#8888aa" }}>
          Secure login via Internet Identity · No password required
        </p>
      </section>

      {/* Feature grid */}
      <section className="px-6 pb-24 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl p-6 border"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#E8E4F8",
                  boxShadow: "0 1px 8px rgba(109,40,217,0.06)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#EDE9FE" }}
                >
                  <Icon size={20} style={{ color: "#6D28D9" }} />
                </div>
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ color: "#0f0a1e" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#4a4a6a" }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="mx-4 mb-10 rounded-3xl px-8 py-14 flex flex-col items-center text-center max-w-5xl mx-auto w-full"
        style={{
          background: "linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%)",
          boxShadow: "0 20px 80px rgba(109,40,217,0.25)",
        }}
      >
        <h2
          className="text-3xl font-bold text-white mb-3 max-w-xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          Your classroom, unified.
        </h2>
        <p
          className="text-base mb-8 max-w-lg"
          style={{ color: "rgba(237,233,254,0.85)" }}
        >
          One platform for curriculum, grading, behavior, analytics, and
          communication. No fragmented tools. No duplicate work.
        </p>
        <button
          type="button"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="login.primary_button"
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
          style={{
            backgroundColor: "#ffffff",
            color: "#6D28D9",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#EDE9FE";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#ffffff";
          }}
        >
          {isLoggingIn ? (
            <svg
              className="animate-spin"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <LogIn size={16} />
          )}
          {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
        </button>
      </section>

      {/* Footer */}
      <footer
        className="text-center pb-10 text-xs"
        style={{ color: "#8888aa" }}
      >
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  // All hooks must be called unconditionally at the top
  const { identity, isInitializing } = useInternetIdentity();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const routerState = useRouterState();
  const { isOpen: contextPanelOpen } = useStudentContext();
  const { moduleNameOverride } = useAppUI();

  // Show a minimal loading state while the auth client initialises
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          data-ocid="app.loading_state"
          className="flex flex-col items-center gap-3"
        >
          <svg
            className="animate-spin"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6D28D9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  // Not logged in — show the landing page
  if (!identity) {
    return <LoginPage />;
  }

  const pathname = routerState.location.pathname;
  const baseRoute = `/${pathname.split("/")[1] || "dashboard"}`;
  const fullRouteModuleName = MODULE_NAMES_FULL[pathname];
  const defaultModuleName =
    fullRouteModuleName ?? MODULE_NAMES[baseRoute] ?? "Dashboard";
  const moduleName = moduleNameOverride ?? defaultModuleName;

  const isViewportConstrained = VIEWPORT_CONSTRAINED_ROUTES.includes(baseRoute);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header moduleName={moduleName} />
        {isViewportConstrained ? (
          // Viewport-constrained: no page scroll, content fills available height
          <main className="flex-1 overflow-hidden p-6 flex flex-col min-h-0 w-full">
            {children}
          </main>
        ) : (
          // Natural scroll: page scrolls when content exceeds viewport
          <main className="flex-1 overflow-y-auto p-6 w-full">
            <div className="w-full">{children}</div>
          </main>
        )}
      </div>

      {/* Student Context Panel — rendered when open */}
      {contextPanelOpen && <StudentContextPanel />}
    </div>
  );
}
