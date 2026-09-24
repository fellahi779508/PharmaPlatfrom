import {
  BarChart3,
  BookAudioIcon,
  CalendarCheck,
  Crown,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Timer,
  TreePine,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "dashboard"
  | "statistics"
  | "sessions"
  | "mindmaps"
  | "exams"
  | "todos"
  | "pomodoro"
  | "leaderboard"
  | "profile"
  | "Up to Date"
  | "subscription";

export type NavItem = {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  tone: string;
};

/**
 * The one place that defines "where can a person go from here".
 * The dashboard grid and the floating QuickNav both read from this list,
 * so the two can never drift out of sync.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    tone: "var(--primary)",
  },
  {
    key: "statistics",
    href: "/dashboard/statistics",
    icon: BarChart3,
    tone: "var(--info)",
  },
  {
    key: "sessions",
    href: "/dashboard/sessions",
    icon: CalendarCheck,
    tone: "var(--primary)",
  },
  {
    key: "exams",
    href: "/dashboard/exams",
    icon: GraduationCap,
    tone: "var(--warning)",
  },
  {
    key: "pomodoro",
    href: "/dashboard/pomodoro",
    icon: Timer,
    tone: "var(--accent)",
  },

  {
    key: "mindmaps",
    href: "/dashboard/mindmaps",
    icon: TreePine,
    tone: "var(--primary)",
  },
  {
    key: "todos",
    href: "/dashboard/todos",
    icon: ListTodo,
    tone: "var(--success)",
  },
  {
    key: "leaderboard",
    href: "/dashboard/leaderboard",
    icon: Trophy,
    tone: "var(--success)",
  },

  {
    key: "Up to Date",
    href: "/dashboard/uptodate",
    icon: BookAudioIcon,
    tone: "var(--accent)",
  },
  {
    key: "profile",
    href: "/dashboard/profile",
    icon: UserRound,
    tone: "var(--accent)",
  },
  {
    key: "subscription",
    href: "/dashboard/subscription",
    icon: Crown,
    tone: "var(--accent)",
  }
];
