import React, { useEffect, useState } from "react";
import {
  Home,
  FileText,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function TopNav({ lastNamespace }: { lastNamespace?: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const isHomePage = location.pathname === "/";

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (email: string) => {
    if (!email) return "U";
    const [name] = email.split("@");
    return name
      .split(".")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="relative h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div
            className="bg-muted rounded-full p-0.5 hover:bg-muted/80 cursor-pointer transition-colors shadow-sm shadow-foreground text-z-depth"
            onClick={() => navigate(isAuthenticated ? "/upload" : "/home")}
            role="button"
            tabIndex={0}
            aria-label="Go to home or upload"
          >
            <div className="rounded-lg p-1 ">
              <FileText className="h-5 w-5 text-foreground " />
            </div>
          </div>
          <h2
            className="text-2xl p-2 sm:text-2xl md:text-2xl font-serif font-normal text-center text-[#3d2406] dark:text-[#f4f5f5] leading-tight"
            onClick={() => navigate(isAuthenticated ? "/upload" : "/home")}
            role="button"
            tabIndex={0}
            aria-label="Go to home or upload"
          >
            RHP Document Assistant
          </h2>
        </div>

        {/* Centered Navigation Links (Desktop) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex ">
          {isAuthenticated && user && (
            <div className="flex gap-6">
              <NavButton icon={<Home size={18} />} label="Home" to="/upload" />
              <NavButton
                icon={<MessageSquare size={18} />}
                label="Chat"
                to={lastNamespace ? `/doc/${lastNamespace}` : "/upload"}
                disabled={!lastNamespace}
              />
              <NavButton
                icon={<Settings size={18} />}
                label="Settings"
                to="/settings"
              />
            </div>
          )}
        </div>

        {/* Right Aligned Items */}
        <div className="flex items-center gap-4">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="text-foreground"
                onClick={() => navigate("/login")}
              >
                Sign In / Sign Up
              </Button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthenticated && user ? (
                  <>
                    <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/upload")}>
                      <Home className="mr-2 h-4 w-4" />
                      <span>Home</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        navigate(
                          lastNamespace ? `/doc/${lastNamespace}` : "/upload"
                        )
                      }
                      disabled={!lastNamespace}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Chat</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onSelect={() => navigate("/login")}>
                    Sign In / Sign Up
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={toggleTheme}>
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>Toggle theme</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </header>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to?: string;
  disabled?: boolean;
}

function NavButton({ icon, label, to, disabled }: NavButtonProps) {
  const location = useLocation();
  const isActive = to && location.pathname === to;
  const button = (
    <button
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-primary/90",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
  return to && !disabled ? <Link to={to}>{button}</Link> : button;
}
