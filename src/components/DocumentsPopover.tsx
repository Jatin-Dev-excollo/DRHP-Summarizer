import React, { useState } from "react";
import { FileText, Plus, Calendar, MessageSquare } from "lucide-react";
import { documentService } from "@/services/api";
import { useNavigate } from "react-router-dom";

export interface DocumentsPopoverProps {
  open: boolean;
  onClose: () => void;
}

export const DocumentsPopover: React.FC<DocumentsPopoverProps> = ({ open, onClose }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    documentService.getAll()
      .then((docs) => {
        setDocuments(docs);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load documents");
        setLoading(false);
      });
  }, [open]);

  // Filter documents by date range
  const filteredDocs = documents.filter((doc) => {
    if (!startDate && !endDate) return true;
    const docDate = new Date(doc.uploadedAt || doc.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && docDate < start) return false;
    if (end && docDate > end) return false;
    return true;
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: '#E5E5E5', fontFamily: 'Inter, Arial, sans-serif' }}>
      <div
        className="relative bg-white rounded-t-3xl shadow-xl w-[95vw] max-w-6xl p-10 flex flex-col animate-slide-up"
        style={{ minHeight: 500, maxHeight: '80vh', marginBottom: 32, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflowY: 'auto' }}
      >
        {/* Close area (click outside) */}
        <div className="fixed inset-0" onClick={onClose} style={{ zIndex: 0, background: 'transparent' }} />
        {/* Main content */}
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <span className="text-2xl font-extrabold text-[#1A2E22]">Documents</span>
            <div>
              <input
                type="text"
                placeholder="Search for Files by their names, time, and day"
                className="w-[350px] rounded-full border border-[#E5E5E5] px-5 py-2 text-base focus:ring-2 focus:ring-[#4B2A06] focus:border-[#4B2A06] outline-none bg-[#F9F9F9] placeholder:text-[#A1A1AA]"
              />
            </div>
          </div>
          {/* Filters */}
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
                    <label className="text-xs mb-1 text-[#232323]">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="border border-[#E5E5E5] rounded px-2 py-1"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs mb-1 text-[#232323]">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="border border-[#E5E5E5] rounded px-2 py-1"
                    />
                  </div>
                  <button
                    className="ml-2 px-4 py-1 rounded bg-[#4B2A06] text-white text-sm font-semibold hover:bg-[#3a2004]"
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
            <div className="flex justify-center items-center h-40 text-lg text-muted-foreground">Loading documents...</div>
          ) : error ? (
            <div className="flex justify-center items-center h-40 text-lg text-destructive">{error}</div>
          ) : (
            <div className="grid grid-cols-4 gap-8 mb-12">
              {filteredDocs.length === 0 ? (
                <div className="col-span-4 text-center text-muted-foreground">No documents found.</div>
              ) : (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col items-start bg-[#F3F4F6] rounded-xl p-6 min-w-[180px] min-h-[110px] w-full cursor-pointer hover:bg-[#ececec] transition"
                    onClick={() => {
                      navigate(`/doc/${doc.namespace || doc.id}`);
                      onClose();
                    }}
                  >
                    <FileText className="h-8 w-8 text-[#4B2A06] mb-4" />
                    <span className="font-semibold text-[#232323] mb-1 max-w-full truncate block" style={{maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{doc.name}</span>
                    <span className="text-[#A1A1AA] text-sm">{doc.size || (doc.fileSize ? `${Math.round(doc.fileSize/1024)} KB` : "")}</span>
                    <span className="text-[#A1A1AA] text-xs mt-1">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}</span>
                  </div>
                ))
              )}
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-auto">
            <button
              className="px-8 py-3 rounded-lg border border-[#232323] text-[#232323] font-semibold bg-white hover:bg-[#F3F4F6] transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-[#4B2A06] text-white font-semibold text-base shadow hover:bg-[#3a2004] transition"
              onClick={() => {
                if (filteredDocs.length > 0) {
                  const doc = filteredDocs[0];
                  navigate(`/doc/${doc.namespace || doc.id}`);
                  onClose();
                }
              }}
            >
              Start Conversation <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .animate-slide-up {
          animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUp {
          0% { transform: translateY(60px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}; 