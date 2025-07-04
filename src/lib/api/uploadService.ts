import axios from "axios";
import { SessionData } from "./sessionService";
import { documentService } from "@/services/api";

const N8N_WEBHOOK_URL =
  "https://n8n-excollo.azurewebsites.net/webhook/bfda1ff3-99be-4f6e-995f-7728ca5b2f6a";
// "https://yashjain3010.app.n8n.cloud/webhook-test/bfda1ff3-99be-4f6e-995f-7728ca5b2f6a"

export interface UploadResponse {
  success: boolean;
  error?: string;
  documentId?: string;
  namespace?: string;
  status: "processing" | "completed" | "failed";
  message?: string;
  document?: any;
}

export interface DocumentStatusResponse {
  status: "processing" | "completed" | "failed";
  documentId?: string;
  namespace?: string;
  error?: string;
  message?: string;
}

export const uploadService = {
  async uploadFile(
    file: File,
    sessionData: SessionData
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("session_id", sessionData.id);
      formData.append("timestamp", new Date().toISOString());
      formData.append("action", "upload");
      formData.append("filename", file.name.replace(".pdf", ""));

      console.log("Uploading file:", file.name, "Size:", file.size);

      const uploadResponse = await axios.post(N8N_WEBHOOK_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 minutes timeout for processing
      });

      console.log("Upload response:", uploadResponse.data);

      // Store document in MongoDB
      if (uploadResponse.data.success) {
        try {
          const documentData = {
            id: uploadResponse.data.documentId || sessionData.id,
            name: file.name,
            namespace:
              uploadResponse.data.namespace || file.name.replace(".pdf", ""),
            status: uploadResponse.data.status || "processing",
            uploadedAt: new Date().toISOString(),
          };

          await documentService.create(documentData);
          console.log("Document stored in MongoDB:", documentData);

          // If the document is still processing, poll for status
          if (documentData.status === "processing") {
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes with 5-second intervals
            const pollInterval = 5000; // 5 seconds

            while (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, pollInterval));
              const statusResponse = await this.checkDocumentStatus(
                documentData.id,
                sessionData
              );

              if (statusResponse.status !== "processing") {
                // Update document status in MongoDB
                await documentService.update(documentData.id, {
                  status: statusResponse.status,
                });
                return {
                  success: true,
                  documentId: documentData.id,
                  namespace: documentData.namespace,
                  status: statusResponse.status,
                  message: statusResponse.message,
                };
              }
              attempts++;
            }
          }
        } catch (dbError) {
          console.error("Error storing document in MongoDB:", dbError);
        }
      }

      return {
        success: uploadResponse.data.success,
        error: uploadResponse.data.error,
        documentId: uploadResponse.data.documentId || sessionData.id,
        namespace:
          uploadResponse.data.namespace || file.name.replace(".pdf", ""),
        status: uploadResponse.data.status || "processing",
        message: uploadResponse.data.message,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
        status: "failed",
      };
    }
  },

  async checkDocumentStatus(
    documentId: string,
    sessionData: SessionData
  ): Promise<DocumentStatusResponse> {
    try {
      console.log("Checking status for document:", documentId);

      const params = new URLSearchParams({
        action: "status",
        document_id: documentId,
        session_id: sessionData.id,
      });

      const response = await axios.get(
        `${N8N_WEBHOOK_URL}?${params.toString()}`
      );

      console.log("Status check response:", response.data);

      // Update document status in MongoDB if it exists
      if (response.data.status) {
        try {
          await documentService.update(documentId, {
            status: response.data.status,
          });
        } catch (dbError) {
          console.error("Error updating document status in MongoDB:", dbError);
        }
      }

      return {
        status: response.data.status || "failed",
        documentId: response.data.documentId,
        namespace: response.data.namespace,
        error: response.data.error,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error checking document status:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
        console.error("Response headers:", error.response?.headers);
      }
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
