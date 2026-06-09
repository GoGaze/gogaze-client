// Shared layout for the authenticated app routes. Living in a (dashboard)
// route group means the chrome — AuthGuard, the sidebar, and its providers —
// mounts ONCE and persists across navigation between these pages; only the
// page content under <main> swaps. (Previously each page rendered
// <DashboardLayout> itself, so the whole sidebar tree remounted on every click,
// causing the visible jank and the collapsed-sidebar width flash.)
//
// The parentheses keep URLs unchanged: (dashboard)/gallery -> /gallery, etc.
import { DashboardLayout } from "@/components/DashboardLayout";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
