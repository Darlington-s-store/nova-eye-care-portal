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
  LogOut, Home as HomeIcon, ShieldCheck, Settings, User, ChevronDown
} from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white overflow-hidden shadow-card shrink-0 border border-border/10">
              <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain p-0.5" />
            </span>
            {!collapsed && <span className="text-sm leading-tight text-foreground">NOVA <span className="block text-[10px] font-bold text-primary uppercase tracking-widest opacity-80">Admin Center</span></span>}
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
            <div className="flex items-center gap-2">
              <NotificationBell audience="admin" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-primary-soft h-10 rounded-full">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                       <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline-block text-xs font-bold text-foreground/80">Admin</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-elegant border-border/40 backdrop-blur bg-card/95">
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground font-normal">
                    Management Control
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary-soft py-2.5">
                    <Link to="/" className="flex items-center w-full">
                      <HomeIcon className="mr-2 h-4 w-4 text-primary" />
                      <span>View Website</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary-soft py-2.5">
                    <Link to="/admin/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4 text-primary" />
                      <span>Admin Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2 bg-border/40" />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="rounded-lg cursor-pointer focus:bg-red-50 text-red-600 focus:text-red-700 font-bold py-2.5"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
