import React, { useEffect, useState } from "react";
import { FileText, Plus, Search, ArrowLeft } from "lucide-react";
import { documentService } from "@/services/api";
import { chatStorageService } from "@/lib/api/chatStorageService";

export interface SidebarProps {
  selectedDocumentId?: string;
  selectedChatId?: string;
  onSelectDocument?: (doc: any) => void;
  onSelectChat?: (chat: any) => void;
  onNewChat?: () => void;
  onBack?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedDocumentId,
  selectedChatId,
  onSelectDocument,
  onSelectChat,
  onNewChat,
  onBack,
}) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [docSearch, setDocSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");

  useEffect(() => {
    documentService.getAll().then(setDocuments);
    // For demo, fetch all chats for all docs (could be optimized)
    (async () => {
      let allChats: any[] = [];
      for (const doc of documents) {
        const docChats = await chatStorageService.getChatsForDoc(doc.id);
        allChats = allChats.concat(docChats.map((c: any) => ({ ...c, docName: doc.name })));
      }
      setChats(allChats);
    })();
  }, [documents.length]);

  const filteredDocs = documents.filter((doc) =>
    doc.name.toLowerCase().includes(docSearch.toLowerCase())
  );
  const filteredChats = chats.filter((chat) =>
    chat.docName?.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="w-[340px] min-w-[260px] max-w-[360px] bg-[#F5F3EF] rounded-[24px] h-full flex flex-col p-6" style={{ fontFamily: 'Inter, Arial, sans-serif', boxShadow: 'none', border: 'none' }}>
      {/* Back arrow */}
      <button className="mb-4" onClick={onBack}>
        <ArrowLeft className="h-6 w-6 text-[#7C7C7C]" />
      </button>
      {/* New Chat Button */}
      <button
        className="w-full flex items-center justify-between bg-[#E7E2DB] rounded-xl px-8 py-5 mb-10 text-[#4B2A06] text-[1.25rem] font-semibold shadow-none border-none hover:bg-[#e0d7ce] transition"
        style={{ fontWeight: 600, fontSize: '1.25rem', borderRadius: '20px' }}
        onClick={onNewChat}
      >
        <span>New Chat</span>
        <Plus className="h-7 w-7 text-[#4B2A06]" />
      </button>
      {/* Documents Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 mt-2">
          <span className="text-xl font-bold text-[#232323] tracking-tight">Documents</span>
          <Search className="h-5 w-5 text-[#232323] cursor-pointer" />
        </div>
        <div className="mb-3">
          <input
            type="text"
            value={docSearch}
            onChange={e => setDocSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg px-3 py-2 bg-[#F5F3EF] border border-[#E7E2DB] text-[#232323] text-base focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-base font-medium truncate transition ${selectedDocumentId === doc.id ? 'bg-[#E7E2DB] text-[#4B2A06] font-bold' : 'bg-transparent text-[#232323] hover:bg-[#F5F3EF] font-medium'}`}
              style={{ fontSize: '1.05rem', borderRadius: '14px' }}
              onClick={() => onSelectDocument && onSelectDocument(doc)}
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span className="truncate">{doc.name}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Chat History Section */}
      <div>
        <div className="flex items-center justify-between mb-3 mt-8">
          <span className="text-xl font-bold text-[#232323] tracking-tight">Chat History</span>
          <Search className="h-5 w-5 text-[#232323] cursor-pointer" />
        </div>
        <div className="mb-3">
          <input
            type="text"
            value={chatSearch}
            onChange={e => setChatSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-lg px-3 py-2 bg-[#F5F3EF] border border-[#E7E2DB] text-[#232323] text-base focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-base font-medium truncate transition ${selectedChatId === chat.id ? 'bg-[#E7E2DB] text-[#4B2A06] font-bold' : 'bg-transparent text-[#232323] hover:bg-[#F5F3EF] font-medium'}`}
              style={{ fontSize: '1.05rem', borderRadius: '14px' }}
              onClick={() => onSelectChat && onSelectChat(chat)}
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span className="truncate">{chat.docName || chat.title || chat.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 