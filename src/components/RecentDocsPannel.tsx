import React, { useMemo, useEffect, useState } from "react";
import { FileText, Clock, Trash2 } from "lucide-react";
import { documentService } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DocumentInfo {
  id: string;
  name: string;
  uploadedAt: string;
  namespace?: string;
}

interface RecentDocsPanelProps {
  currentDocument: DocumentInfo | null;
  onDocumentSelect?: (doc: DocumentInfo) => void;
}

export function RecentDocsPanel({
  currentDocument,
  onDocumentSelect,
}: RecentDocsPanelProps) {
  const [recentDocuments, setRecentDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentInfo | null>(
    null
  );

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const documents = await documentService.getAll();
        setRecentDocuments(documents);
        setError(null);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError("Failed to load recent documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Memoize the formatted documents to prevent unnecessary re-renders
  const formattedDocuments = useMemo(() => {
    return recentDocuments.map((doc) => ({
      ...doc,
      formattedDate: new Date(doc.uploadedAt).toLocaleString(),
    }));
  }, [recentDocuments]);

  const handleDocumentClick = (doc: DocumentInfo) => {
    if (onDocumentSelect) {
      onDocumentSelect({
        ...doc,
        id: doc.id,
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, doc: DocumentInfo) => {
    e.stopPropagation(); // Prevent document selection when clicking delete
    setDocumentToDelete(doc);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await documentService.delete(documentToDelete.id);
      setRecentDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentToDelete.id)
      );
      toast.success("Document deleted successfully");

      // If the deleted document was the current document, clear the selection
      if (currentDocument?.id === documentToDelete.id && onDocumentSelect) {
        onDocumentSelect(null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setDocumentToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 p-4 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-4 bg-card rounded-lg border border-border">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-2 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Recent Uploaded Documents
        </h3>
        {formattedDocuments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No documents uploaded yet
          </p>
        ) : (
          <div className="max-h-[80vh] overflow-y-auto scrollbar-hide">
            <ul className="space-y-2">
              {formattedDocuments.map((doc) => (
                <li
                  key={doc.id}
                  className={`flex items-center p-2 rounded-lg transition-colors cursor-pointer ${
                    currentDocument?.id === doc.id
                      ? "bg-accent/20 text-accent-foreground"
                      : "hover:bg-muted/30 text-foreground"
                  }`}
                  onClick={() => handleDocumentClick(doc)}
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center mr-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {doc.formattedDate}
                    </div>
                    {doc.namespace && (
                      <p className="text-xs text-muted-foreground/70 truncate">
                        Namespace: {doc.namespace}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentDocument?.id === doc.id && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                        Current
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteClick(e, doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={() => setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
