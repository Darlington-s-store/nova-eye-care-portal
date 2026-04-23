import { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, CalendarDays, Users, Star, MessageSquare, BookOpen,
  Eye, LogOut, Home as HomeIcon, ShieldCheck,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/notifications", label: "Notifications", icon: MessageSquare },
  { to: "/admin/chatbot", label: "Chatbot KB", icon: BookOpen },
];

const AdminSidebarInner = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`px-4 py-5 border-b border-sidebar-border ${collapsed ? "px-2" : ""}`}>
          <Link to="/admin" className="flex items-center gap-2 font-bold text-sidebar-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-hero-gradient text-primary-foreground shadow-card shrink-0">
              <Eye className="h-5 w-5" />
            </span>
            {!collapsed && <span className="text-sm leading-tight">NOVA <span className="block text-xs font-medium opacity-70">Admin</span></span>}
          </Link>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Manage"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const isActive = it.end ? location.pathname === it.to : location.pathname.startsWith(it.to);
                return (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={it.to}
                        end={it.end}
                        className={`flex items-center gap-2 ${isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent/50"}`}
                      >
                        <it.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{it.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-soft-gradient">
        <AdminSidebarInner />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-14 sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur flex items-center justify-between px-4 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Admin Console
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell audience="admin" />
              <Button asChild variant="ghost" size="sm">
                <Link to="/" className="gap-1"><HomeIcon className="h-4 w-4" /> <span className="hidden sm:inline">Site</span></Link>
              </Button>
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
