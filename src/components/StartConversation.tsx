import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
import { documentService } from "@/services/api";
import { uploadService } from "@/lib/api/uploadService";
import { sessionService } from "@/lib/api/sessionService";
import { toast } from "sonner";
import { useRefreshProtection } from "../hooks/useRefreshProtection";

export const StartConversation: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionData] = useState(() => sessionService.initializeSession());

  useRefreshProtection(
    isUploading,
    "A file is currently uploading. Please wait."
  );

  // Helper for initials
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

  const fetchDocuments = () => {
    setLoading(true);
    setError(null);
    documentService
      .getAll()
      .then((docs) => {
        setDocuments(docs);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load documents");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(
      <div className="flex items-center gap-2">
        <span>Uploading {file.name}...</span>
      </div>
    );

    try {
      const response = await uploadService.uploadFile(file, sessionData);

      if (!response.success) {
        throw new Error(response.error || "Upload failed");
      }

      if (response.status === "completed") {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>
              <strong>{file.name}</strong> stored successfully!
            </span>
          </div>,
          {
            id: toastId,
            duration: 4000,
          }
        );
        fetchDocuments(); // Refresh the document list
      } else if (response.status === "failed") {
        throw new Error(response.error || "Processing failed");
      } else {
        toast.warning(
          "Upload service did not return completed or failed status immediately.",
          {
            id: toastId,
            duration: 4000,
          }
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span>
            {error instanceof Error ? error.message : "Upload failed"}
          </span>
        </div>,
        {
          id: toastId,
          duration: 4000,
        }
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Filter documents by date range and search
  const filteredDocs = documents.filter((doc) => {
    if (search && !doc.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    const docDate = new Date(doc.uploadedAt || doc.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && docDate < start) return false;
    if (end && docDate > end) return false;
    return true;
  });

  return (
    <div
      className="min-h-screen bg-white flex flex-col font-sans"
      style={{ fontFamily: "Inter, Arial, sans-serif" }}
    >
      {/* Header */}
      <header className="w-full flex items-center h-20 px-12 bg-white border-b border-[#F3F3F3]">
        <span
          className="text-2xl font-extrabold text-[#232323] tracking-tight"
          style={{ fontFamily: "Inter, Arial, sans-serif" }}
        >
          PDF Summariser
        </span>
        <div className="flex-1" />
        {/* Search bar in header */}
        <input
          type="text"
          placeholder="Search for Files by their names, time, and day"
          className="w-[480px] rounded-full border border-[#E5E5E5] px-5 py-2 text-base focus:ring-2 focus:ring-[#4B2A06] focus:border-[#4B2A06] outline-none bg-[#F9F9F9] placeholder:text-[#A1A1AA] mr-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginRight: 32 }}
        />
        <div className="flex items-center gap-6 text-[#232323] text-2xl">
          {/* Chat icon disabled (no document selected) */}
          <span
            className="opacity-50 cursor-not-allowed pointer-events-none"
            title="Select a document to enable chat"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-message-square"
              viewBox="0 0 24 24"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path>
            </svg>
          </span>
          <span
            className="cursor-pointer"
            onClick={() => navigate("/dashboard")}
            title="Home"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-home"
              viewBox="0 0 24 24"
            >
              <path d="M3 9.5V22h6v-6h6v6h6V9.5L12 3Z"></path>
            </svg>
          </span>
          {/* Settings icon */}
          <span
            className="cursor-pointer"
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-settings"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.25 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.66 0 1.25.39 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.25.39-1.51 1Z"></path>
            </svg>
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
                    <p className="text-sm font-medium leading-none">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/settings")}>
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
      <main className="flex-1 flex flex-col px-24 pt-6 pb-24 relative max-w-[1400px] mx-auto w-full">
        {/* Upload button at top right */}
        <div className="flex justify-end mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf"
            className="hidden"
            disabled={isUploading}
          />
          <button
            className="flex items-center gap-2 bg-[#4B2A06] text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg transition hover:bg-[#3A2004] focus:outline-none"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Upload <Upload className="h-6 w-6" />
              </>
            )}
          </button>
        </div>
        <h1
          className="text-5xl font-extrabold mb-8"
          style={{ color: "#232323", fontFamily: "Inter, Arial, sans-serif" }}
        >
          Start New <span style={{ color: "#FF7A1A" }}>Conversation</span>
        </h1>
        {/* Filters and Search */}
        <div className="flex gap-4 mb-8 items-center">
          <button className="flex items-center gap-2 bg-[#F3F4F6] text-[#5A6473] font-semibold px-6 py-2 rounded-lg text-base">
            All Files
          </button>
          <div className="relative">
            <button
              className="flex items-center gap-2 bg-[#F3F4F6] text-[#5A6473] font-semibold px-6 py-2 rounded-lg text-base"
              onClick={() => setShowDatePicker((v) => !v)}
              type="button"
            >
              Date Range <Calendar className="h-4 w-4" />
            </button>
            {showDatePicker && (
              <div className="absolute left-0 mt-2 bg-white border border-[#E5E5E5] rounded-lg shadow-lg p-4 flex gap-4 z-20">
                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-[#232323]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-[#E5E5E5] rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-[#232323]">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-[#E5E5E5] rounded px-2 py-1"
                  />
                </div>
                <button
                  className="ml-2 px-4 py-1 rounded bg-[#4B2A06] text-white text-sm font-semibold hover:bg-[#3A2004]"
                  onClick={() => setShowDatePicker(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Document Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-40 text-lg text-muted-foreground">
            Loading documents...
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40 text-lg text-destructive">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-8 mb-12">
            {filteredDocs.length === 0 ? (
              <div className="col-span-4 text-center text-muted-foreground">
                No documents found.
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex flex-col items-start bg-[#F3F4F6] rounded-xl p-6 min-w-[180px] min-h-[110px] w-full cursor-pointer hover:bg-[#ECECEC] transition ${
                    selectedDoc && selectedDoc.id === doc.id
                      ? "ring-2 ring-[#4B2A06] bg-[#ECECEC]"
                      : ""
                  }`}
                  onClick={() => navigate(`/doc/${doc.namespace || doc.id}`)}
                >
                  <FileText className="h-8 w-8 text-[#4B2A06] mb-4" />
                  <span
                    className="font-semibold text-[#232323] mb-1 max-w-full truncate block"
                    style={{
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.name}
                  </span>
                  <span className="text-[#A1A1AA] text-sm">
                    {doc.size ||
                      (doc.fileSize
                        ? `${Math.round(doc.fileSize / 1024)} KB`
                        : "")}
                  </span>
                  <span className="text-[#A1A1AA] text-xs mt-1">
                    {doc.uploadedAt
                      ? new Date(doc.uploadedAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};
