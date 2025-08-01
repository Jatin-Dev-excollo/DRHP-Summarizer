import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { SummaryPanel } from "@/components/SummaryPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { Loader2 } from "lucide-react";
import { uploadService } from "@/lib/api/uploadService";
import { sessionService } from "@/lib/api/sessionService";
import { documentService } from "@/services/api";
import { Sidebar } from "@/components/Sidebar";
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
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { DocumentPopover } from "@/components/ChatPanel";

export default function ChatSummaryLayout() {
  const { namespace } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDocument, setCurrentDocument] = useState(null);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  const [isSummaryProcessing, setIsSummaryProcessing] = useState(false);
  const [isInitialDocumentProcessing, setIsInitialDocumentProcessing] =
    useState(true);
  const [sessionData] = useState(() => sessionService.initializeSession());
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const { user, logout, isAuthenticated } = useAuth();

  const chatId = searchParams.get("chatId");

  useEffect(() => {
    let isMounted = true;
    const fetchAndSetDocument = async () => {
      if (!namespace) {
        if (isMounted) {
          setIsInitialDocumentProcessing(false);
          setCurrentDocument(null);
        }
        return;
      }
      try {
        setIsInitialDocumentProcessing(true);
        const doc = await documentService.getById(namespace);
        if (isMounted) {
          setCurrentDocument(doc);
          setSelectedSummaryId(null);
          setIsSummaryProcessing(false);
          const statusResponse = await uploadService.checkDocumentStatus(
            doc.id,
            sessionData
          );
          if (isMounted) {
            if (statusResponse.status !== "processing") {
              setIsInitialDocumentProcessing(false);
            }
          }
        }
      } catch (error) {
        setCurrentDocument(null);
        setIsInitialDocumentProcessing(false);
      }
    };
    fetchAndSetDocument();
    return () => {
      isMounted = false;
    };
  }, [namespace, sessionData]);

  const handleSelectDocument = (doc) => {
    if (doc) {
      navigate(`/doc/${doc.id}`);
    }
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    if (!currentDocument) {
      toast.error("Please select a document to start a new chat.");
      return;
    }
    setNewChatTrigger(Date.now());
    setSidebarOpen(false);
  };

  const handleSelectChat = (chat) => {
    if (!chat) return;
    if (!currentDocument || chat.documentId !== currentDocument.id) {
      navigate(`/doc/${chat.documentId}?chatId=${chat.id}`);
    } else {
      setSearchParams({ chatId: chat.id });
    }
    setSidebarOpen(false);
  };

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

  if (!currentDocument && !isInitialDocumentProcessing) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-destructive">
            Document Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The document you are looking for does not exist or you may not have
            access.
          </p>
          <button onClick={() => navigate("/upload")} className="mt-4">
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  if (isInitialDocumentProcessing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Checking document status...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAFAFA]">
      <Navbar onSidebarOpen={() => setSidebarOpen(true)} />
      {/* Sidebar Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay background */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar content */}
          <div className="relative z-50 animate-slide-in-left">
            <Sidebar
              selectedDocumentId={currentDocument?.id}
              selectedChatId={chatId}
              onBack={() => setSidebarOpen(false)}
              onSelectDocument={handleSelectDocument}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
            />
          </div>
        </div>
      )}
      {/* Main Content: Two columns */}
      <div
        className={`flex flex-1 w-full h-[calc(100vh-80px)] overflow-hidden px-0 py-0 ${
          sidebarOpen ? "ml-[340px]" : ""
        }`}
      >
        {/* Summary Card */}
        <div className="flex flex-col w-[32%] min-w-[340px] max-w-[480px] bg-white rounded-l-2xl rounded-r-none shadow-xl p-8 h-full justify-stretch">
          {/* <div className="flex items-center mb-8">
            <button
              className="bg-[#4B2A06] text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg hover:bg-[#3a2004] focus:outline-none"
              onClick={() => setSelectedSummaryId(null)}
            >
              New Summary
            </button>
            <div className="flex-1" />
            <button className="ml-2 p-3 rounded-full border border-[#E5E5E5] bg-[#F9F9F9] hover:bg-[#ececec] shadow">
              <svg width="22" height="22" fill="none" stroke="#232323" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
          </div> */}
          <div className="flex-1 overflow-y-auto pr-1">
            <SummaryPanel
              isDocumentProcessed={true}
              currentDocument={currentDocument}
              onProcessingChange={setIsSummaryProcessing}
              selectedSummaryId={selectedSummaryId}
              onSummarySelect={setSelectedSummaryId}
            />
          </div>
        </div>
        {/* Chat Panel (right) */}
        <div className="flex-1 flex flex-col bg-[#FAFAFA] p-0 h-full ml-0 rounded-r-2xl rounded-l-none shadow-none justify-stretch">
          <div className="flex flex-col h-full w-full">
            <div className="flex items-center gap-2 mt-4 mb-4 ml-2">
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="#232323"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-file-text"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" x2="8" y1="13" y2="13"></line>
                <line x1="16" x2="8" y1="17" y2="17"></line>
                <line x1="10" x2="8" y1="9" y2="9"></line>
              </svg>
              <DocumentPopover
                documentId={currentDocument?.id}
                documentName={
                  currentDocument?.name || currentDocument?.namespace || ""
                }
              />
            </div>
            <ChatPanel
              isDocumentProcessed={true}
              currentDocument={currentDocument}
              onProcessingChange={setIsSummaryProcessing}
              newChatTrigger={newChatTrigger}
              chatId={chatId}
              customStyles={{
                containerBg: "#FAFAFA",
                inputBg: "#fff",
                inputBorder: "#fff",
                sendBtnBg: "#4B2A06",
                sendBtnIcon: "#fff",
                userBubble: "#F3F4F6",
                botBubble: "#F9F6F2",
                userText: "#232323",
                botText: "#4B2A06",
                timestamp: "#A1A1AA",
                inputRadius: "9999px",
                inputShadow: "0 2px 8px 0 #E5E5E5",
                removeHeader: true,
                removeInputBorder: true,
                inputPlaceholder: "Ask a question about your document...",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
