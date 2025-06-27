import React, { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { DocumentsPopover } from "./DocumentsPopover";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";

export const StartConversation: React.FC = () => {
  const [showDocs, setShowDocs] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  // Helper for initials
  const getUserInitials = (email) => {
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
    <div className="min-h-screen bg-white flex flex-col font-sans" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Accurate PDF Summariser Header */}
      <header className="w-full flex items-center h-20 px-12 bg-white border-b border-[#F3F3F3]">
        <span className="text-2xl font-extrabold text-[#232323] tracking-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
          PDF Summariser
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-6 text-[#232323] text-2xl">
          {/* Chat icon disabled (no document selected) */}
          <span className="opacity-50 cursor-not-allowed pointer-events-none" title="Select a document to enable chat">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path></svg>
          </span>
          <span className="cursor-pointer" onClick={() => navigate('/dashboard')} title="Home">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home" viewBox="0 0 24 24"><path d="M3 9.5V22h6v-6h6v6h6V9.5L12 3Z"></path></svg>
          </span>
          {/* Settings icon */}
          <span className="cursor-pointer" onClick={() => navigate('/settings')} title="Settings">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.25 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.66 0 1.25.39 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.25.39-1.51 1Z"></path></svg>
          </span>
          {/* User Avatar Dropdown */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-[#4B2A06] text-center" style={{ fontFamily: 'Inter, Arial, sans-serif', fontWeight: 800 }}>
          Start New <span className="text-[#FF7A1A]">Conversation</span>
        </h1>
        <p className="text-[#5A6473] text-xl mt-6 mb-12 text-center" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
        </p>
        <div className="flex gap-8 mt-2">
          <button
            className="flex items-center gap-3 bg-[#4B2A06] text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg transition hover:bg-[#3a2004] focus:outline-none"
            onClick={() => setShowDocs(true)}
          >
            Documents <FileText className="h-6 w-6" />
          </button>
          <button className="flex items-center gap-3 bg-[#4B2A06] text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg transition hover:bg-[#3a2004] focus:outline-none">
            Upload <Upload className="h-6 w-6" />
          </button>
        </div>
        <DocumentsPopover open={showDocs} onClose={() => setShowDocs(false)} />
      </main>
    </div>
  );
}; 