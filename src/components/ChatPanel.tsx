import React, { useState, useRef, useEffect } from "react";
import { Send, User, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { n8nService } from "@/lib/api/n8nService";
import {
  ConversationMemory,
  MemoryContext,
  SessionData,
  sessionService,
} from "@/lib/api/sessionService";
import {
  chatStorageService,
  ChatSession,
  ChatMessage,
} from "@/lib/api/chatStorageService";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatPanelCustomStyles {
  containerBg?: string;
  inputBg?: string;
  inputBorder?: string;
  sendBtnBg?: string;
  sendBtnIcon?: string;
  userBubble?: string;
  botBubble?: string;
  userText?: string;
  botText?: string;
  timestamp?: string;
  inputRadius?: string;
  inputShadow?: string;
  removeHeader?: boolean;
  removeInputBorder?: boolean;
  inputPlaceholder?: string;
}

interface ChatPanelProps {
  isDocumentProcessed: boolean;
  currentDocument: {
    id: string;
    name: string;
    uploadedAt: string;
    namespace?: string;
  } | null;
  chatId?: string | null;
  onChatCreated?: (chatId: string) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  customStyles?: ChatPanelCustomStyles;
}

// Helper function to format bot messages
const formatBotMessage = (content: string): string => {
  if (!content) return "";

  // Split into lines first to handle existing newlines
  const lines = content.split("\n");

  const formattedLines = lines.map((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) return ""; // Keep empty lines

    // Check for bullet points (- , *, +) or numbered list items (1., 2., etc.)
    if (/^[-*+]\s/.test(trimmedLine)) {
      // Replace common bullet point markers with a standard one and keep the rest of the line
      return "•  " + trimmedLine.substring(1).trim();
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      // Keep numbered list items as is
      return trimmedLine;
    } else {
      // For other lines, add a newline after each period followed by a space
      return trimmedLine.replace(/\. \s/g, ".\n");
    }
  });

  // Join processed lines with newlines
  return formattedLines.join("\n");
};

export function ChatPanel({
  isDocumentProcessed,
  currentDocument,
  chatId,
  onChatCreated,
  onProcessingChange,
  customStyles = {},
}: ChatPanelProps) {
  const [sessionData, setSessionData] = useState<SessionData>(() =>
    sessionService.initializeSession()
  );
  const [conversationMemory, setConversationMemory] = useState<
    ConversationMemory[]
  >([]);
  const [memoryContext, setMemoryContext] = useState<MemoryContext>({
    last_topic: null,
    user_interests: [],
    conversation_summary: "",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    chatId || null
  );
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat session when chatId or document changes
  useEffect(() => {
    const loadChat = async () => {
      if (!currentDocument) {
        setMessages([]);
        setCurrentChatId(null);
        return;
      }

      try {
        if (chatId) {
          const chats = await chatStorageService.getChatsForDoc(
            currentDocument.id
          );
          const chat = chats.find((c) => c.id === chatId);
          if (chat && Array.isArray(chat.messages)) {
            setMessages(
              chat.messages.map((m) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }))
            );
            setCurrentChatId(chat.id);
          }
        } else {
          const chats = await chatStorageService.getChatsForDoc(
            currentDocument.id
          );
          if (chats && chats.length > 0 && Array.isArray(chats[0].messages)) {
            setMessages(
              chats[0].messages.map((m) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }))
            );
            setCurrentChatId(chats[0].id);
          } else {
            setMessages([
              {
                id: "1",
                content:
                  "Hello! I'm your RHP document assistant. Ask a question about it to start a chat.",
                isUser: false,
                timestamp: new Date(),
              },
            ]);
            setCurrentChatId(null);
          }
        }
      } catch (error) {
        console.error("Error loading chat:", error);
        setMessages([]);
        setCurrentChatId(null);
      }
    };

    loadChat();
  }, [currentDocument, chatId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentDocument) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    let chat: ChatSession | undefined;
    let newChatId = currentChatId;
    let newMessages: Message[] = [];

    try {
      if (!currentChatId) {
        chat = await chatStorageService.createChatForDoc(
          currentDocument.id,
          userMessage
        );
        newChatId = chat.id;
        setCurrentChatId(newChatId);
        if (onChatCreated) onChatCreated(newChatId);
        newMessages = chat.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      } else {
        const chats = await chatStorageService.getChatsForDoc(
          currentDocument.id
        );
        chat = chats.find((c) => c.id === currentChatId);
        if (chat) {
          chat.messages.push(userMessage);
          chat.updatedAt = new Date().toISOString();
          await chatStorageService.saveChatForDoc(currentDocument.id, chat);
          newMessages = chat.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
        }
      }

      setMessages(newMessages);
      setInputValue("");
      setIsTyping(true);
      onProcessingChange?.(true);

      const response = await n8nService.sendMessage(
        inputValue,
        sessionData,
        conversationMemory,
        currentDocument.name
      );

      // Update memory context if provided
      if (response.memory_context) {
        setMemoryContext(response.memory_context);
      }

      // Update conversation memory
      const newUserMessageMemory: ConversationMemory = {
        type: "user",
        text: inputValue,
        timestamp: Date.now(),
      };

      const newBotMessageMemory: ConversationMemory = {
        type: "bot",
        text: response.response,
        timestamp: Date.now(),
      };

      setConversationMemory((prev) => [
        ...prev,
        newUserMessageMemory,
        newBotMessageMemory,
      ]);

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      // Save bot response to chat
      if (currentDocument && newChatId) {
        const chats = await chatStorageService.getChatsForDoc(
          currentDocument.id
        );
        const chat = chats.find((c) => c.id === newChatId);
        if (chat) {
          chat.messages.push(aiResponse);
          chat.updatedAt = new Date().toISOString();
          await chatStorageService.saveChatForDoc(currentDocument.id, chat);
          setMessages(
            chat.messages.map((m) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while processing your message.",
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      if (currentDocument && newChatId) {
        try {
          const chats = await chatStorageService.getChatsForDoc(
            currentDocument.id
          );
          const chat = chats.find((c) => c.id === newChatId);
          if (chat) {
            chat.messages.push(errorMessage);
            chat.updatedAt = new Date().toISOString();
            await chatStorageService.saveChatForDoc(currentDocument.id, chat);
            setMessages(
              chat.messages.map((m) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }))
            );
          } else {
            // If chat not found, just add the error message to current messages
            setMessages((prevMessages) => [
              ...prevMessages,
              { ...errorMessage, timestamp: new Date(errorMessage.timestamp) },
            ]);
          }
        } catch (saveError) {
          console.error("Error saving error message:", saveError);
          // If saving fails, just add the error message to current messages without saving
          setMessages((prevMessages) => [
            ...prevMessages,
            { ...errorMessage, timestamp: new Date(errorMessage.timestamp) },
          ]);
        }
      }
    } finally {
      setIsTyping(false);
      onProcessingChange?.(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full pb-16"
      style={{ background: customStyles.containerBg || undefined }}
    >
      {/* Conditionally render header */}
      {!customStyles.removeHeader && (
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-lg text-foreground">
            Chat Assistant
          </h2>
          <span className="text-xs px-2 py-1 rounded-full bg-card text-muted-foreground">
            {isDocumentProcessed ? "Document Loaded" : "Awaiting Document"}
          </span>
        </div>
      )}
      <ScrollArea className="flex-1 h-[20vh]" style={{ background: customStyles.containerBg || undefined }}>
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              {!message.isUser && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl p-4 max-w-[80%]",
                  message.isUser
                    ? "rounded-br-none"
                    : "rounded-bl-none whitespace-pre-wrap"
                )}
                style={{
                  background: message.isUser
                    ? customStyles.userBubble || "#F3F4F6"
                    : customStyles.botBubble || "#F9F6F2",
                  color: message.isUser
                    ? customStyles.userText || "#232323"
                    : customStyles.botText || "#4B2A06",
                }}
              >
                <p className="text-sm break-words">
                  {message.isUser
                    ? message.content
                    : formatBotMessage(message.content)}
                </p>
                <span
                  className="text-xs opacity-70 block mt-1"
                  style={{ color: customStyles.timestamp || "#A1A1AA" }}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {message.isUser && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex max-w-[80%] mr-auto animate-fade-in items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="rounded-2xl p-3 bg-card text-card-foreground">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={customStyles.inputPlaceholder || "Ask a question about your document..."}
            className="flex-1"
            style={{
              background: customStyles.inputBg || undefined,
              borderColor: customStyles.inputBorder || undefined,
              borderRadius: customStyles.inputRadius || undefined,
              boxShadow: customStyles.inputShadow || undefined,
              borderWidth: customStyles.removeInputBorder ? 0 : undefined,
            }}
            disabled={!isDocumentProcessed}
          />
          <Button
            type="submit"
            size="icon"
            style={{
              background: customStyles.sendBtnBg || undefined,
              borderRadius: customStyles.inputRadius || undefined,
              boxShadow: customStyles.inputShadow || undefined,
            }}
            className={cn(
              "text-primary-foreground hover:opacity-90 transition-opacity",
              !isDocumentProcessed && "opacity-50 pointer-events-none"
            )}
            disabled={!isDocumentProcessed}
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: customStyles.sendBtnIcon || undefined }} />
            ) : (
              <Send className="h-4 w-4" style={{ color: customStyles.sendBtnIcon || undefined }} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
