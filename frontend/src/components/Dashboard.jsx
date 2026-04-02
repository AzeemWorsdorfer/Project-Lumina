import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MapCanvas from "./MapCanvas";
import PdfViewer from "./PdfViewer";
import { API_BASE_URL } from "../config.js";
import { fetchPdfUrl } from "../services/api.js";
import { toast, Toaster } from "sonner";
import { PanelLeftOpen, BookOpen } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { getAccessToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [sessionHints, setSessionHints] = useState({});

  const getHints = () => sessionHints[activeSessionId] || [];
  
  const handleAddHint = (hint) => {
    setSessionHints((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), hint],
    }));
  };

  const fetchSessions = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        return;
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to fetch sessions");
      }
      
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error(error.message || "Failed to load sessions");
    }
  };

  const handleCreateSession = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const token = await getAccessToken();
        const response = await fetch(
          `${API_BASE_URL}/api/v1/upload-pdf?session_name=${encodeURIComponent(file.name)}`,
          {
            method: "POST",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
          },
        );

        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          return;
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.detail || "Ingestion failed");
        }

        await fetchSessions();
        toast.success("Study session created successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(error.message || "Failed to upload PDF");
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSelectSession = (id) => {
    console.log("Switching to session:", id);
    setActiveSessionId(id);
  };

  const handleDelete = (id) => {
    toast.warning("Are you sure you want to delete this session?", {
      cancel: {
        label: "Cancel",
        action: () => {},
      },
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const token = await getAccessToken();
            const response = await fetch(
              `${API_BASE_URL}/api/v1/session/${id}`,
              {
                method: "DELETE",
                headers: {
                  ...(token && { Authorization: `Bearer ${token}` }),
                },
              },
            );
            
            if (response.status === 401) {
              toast.error("Session expired. Please log in again.");
              return;
            }
            
            if (response.ok) {
              setSessions(sessions.filter((s) => s.id !== id));
              if (id === activeSessionId) {
                setActiveSessionId(null);
              }
              toast.success("Session deleted successfully");
            } else {
              const error = await response.json().catch(() => ({}));
              throw new Error(error.detail || "Delete failed");
            }
          } catch (error) {
            console.error("Delete failed:", error);
            toast.error(error.message || "Failed to delete session");
          }
        },
      },
    });
  };

  const handleViewPdf = async (sessionId) => {
    try {
      const token = await getAccessToken();
      const url = await fetchPdfUrl(sessionId, token);
      setPdfUrl(url);
      setShowPdfViewer(true);
    } catch (error) {
      console.error("Error fetching PDF:", error);
      if (error.message?.includes("401")) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to load PDF");
      }
    }
  };

  return (
    <div className="flex flex-1 h-full bg-slate-900 overflow-hidden text-slate-200">
      <Sidebar
        sessions={sessions}
        onNewSession={handleCreateSession}
        onSelectSession={handleSelectSession}
        onDelete={handleDelete}
        onViewPdf={handleViewPdf}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isUploading={isUploading}
      />

      <main className="flex-1 relative h-full transition-all duration-300 ease-in-out">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-all"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        {activeSessionId ? (
          <MapCanvas 
            sessionId={activeSessionId} 
            hints={getHints()}
            onAddHint={handleAddHint}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="p-4 bg-slate-800/50 rounded-full mb-4">
              <BookOpen className="w-12 h-12 text-amber-500/30" />
            </div>
            <p className="text-lg font-light text-slate-500 tracking-wide">
              Select a session to explore the map
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Upload a PDF to create a new study session
            </p>
          </div>
        )}
      </main>

      <Toaster theme="dark" position="bottom-right" richColors closeButton />

      {showPdfViewer && pdfUrl && (
        <PdfViewer
          url={pdfUrl}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
    </div>
  );
}
