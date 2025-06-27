import React, { useMemo, useEffect, useState } from "react";
import { chatService } from "@/services/api";
import { Navigate, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
  documentId: string;
}

function groupChatsByDay(chats: Chat[]) {
  const now = new Date();
  const today: Chat[] = [];
  const yesterday: Chat[] = [];
  const lastWeek: Chat[] = [];
  const older: Chat[] = [];

  chats.forEach((chat) => {
    const chatDate = new Date(chat.updatedAt);
    const diffDays = Math.floor(
      (now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) today.push(chat);
    else if (diffDays === 1) yesterday.push(chat);
    else if (diffDays <= 7) lastWeek.push(chat);
    else older.push(chat);
  });

  return [
    { label: "Today", chats: today },
    { label: "Yesterday", chats: yesterday },
    { label: "Last Week", chats: lastWeek },
    { label: "Older", chats: older },
  ].filter((g) => g.chats.length > 0);
}

interface ChatHistorySidebarProps {
  documentId: string;
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
}

export function ChatHistorySidebar({
  documentId,
  selectedChatId,
  onSelectChat,
}: ChatHistorySidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      if (!documentId) {
        setChats([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedChats = await chatService.getByDocumentId(documentId);
        // Ensure we only get chats for this document
        const documentChats = Array.isArray(fetchedChats)
          ? fetchedChats.filter((chat) => chat.documentId === documentId)
          : [];
        setChats(documentChats);
        setError(null);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to load chat history");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [documentId]);

  const grouped = useMemo(() => groupChatsByDay(chats), [chats]);
  const navigate = useNavigate();

  const handleDelete = async (chatId: string) => {
    try {
      await chatService.delete(chatId);
      setChats(chats.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId && onSelectChat) onSelectChat(null);
    } catch (err) {
      console.error("Error deleting chat:", err);
      setError("Failed to delete chat");
    }
  };

  const handleNewChat = async () => {
    if (!documentId) {
      setError("No document selected");
      return;
    }

    try {
      // Create a new chat with a default title and initial message
      const newChat = await chatService.create({
        id: Date.now().toString(),
        title: "New Chat",
        messages: [
          {
            id: Date.now().toString(),
            content:
              "Hello! I'm your RHP document assistant. Ask a question about it to start a chat.",
            isUser: false,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
        documentId: documentId,
      });

      setChats([newChat, ...chats]);

      // Select the new chat
      if (onSelectChat) {
        onSelectChat(newChat.id);
      }
    } catch (err) {
      console.error("Error creating new chat:", err);
      setError("Failed to create new chat");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <button
          className="p-2 bg-secondary text-secondary-foreground rounded hover:opacity-90 transition-colors text-sm font-semibold flex items-center gap-1"
          onClick={handleNewChat}
          disabled={!documentId}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>
      {grouped.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No chats yet for this document.
        </p>
      ) : (
        grouped.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.chats.map((chat) => (
                <li
                  key={chat.id}
                  className={`flex items-center p-2 rounded-lg transition-colors cursor-pointer ${
                    selectedChatId === chat.id
                      ? "bg-accent/20 text-accent-foreground"
                      : "hover:bg-muted/30 text-foreground"
                  }`}
                  onClick={() => onSelectChat && onSelectChat(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {chat.title === "New Chat" && chat.messages.length > 1
                        ? chat.messages[1].content.slice(0, 30) + "..."
                        : chat.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(chat.updatedAt)}
                    </div>
                  </div>
                  <button
                    className="ml-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(chat.id);
                    }}
                    title="Delete chat"
                  >
                    &#10005;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
