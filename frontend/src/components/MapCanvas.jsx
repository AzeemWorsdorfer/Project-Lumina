import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { fetchSession, saveMindMap, getSocraticHintStream } from "../services/api.js";
import { backendToReactFlow } from "../utils/mapTransform.js";
import { toast } from "sonner";
import { Loader2, Check, AlertCircle } from "lucide-react";
import Toolbar from "./Toolbar.jsx";
import EditableNode from "./EditableNode.jsx";
import { useAuth } from "../contexts/AuthContext";

const nodeTypes = { editableNode: EditableNode };
const initialNodes = [];
const initialEdges = [];

const isPlaceholderNode = (nodes) => {
  return nodes.length === 1 && nodes[0]?.data?.label === "Select a Session";
};

let nodeCounter = 0;

const MapCanvas = ({ sessionId, hints, onAddHint }) => {
  const { getAccessToken } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [edgeSource, setEdgeSource] = useState(null);
  const debounceRef = useRef(null);

  const loadSession = useCallback(async (id) => {
    if (!id) return;
    
    setIsLoading(true);
    setSaveStatus("saved");
    setHasLoaded(false);
    
    try {
      const token = await getAccessToken();
      const session = await fetchSession(id, token);
      
      if (session.mind_map_data && session.mind_map_data.nodes?.length > 0) {
        const { nodes: savedNodes, edges: savedEdges } = backendToReactFlow(
          session.mind_map_data
        );
        setNodes(savedNodes);
        setEdges(savedEdges);
      } else {
        setNodes(initialNodes);
        setEdges([]);
      }
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error loading session:", error);
      if (error.message?.includes("401")) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to load session data");
      }
      setNodes(initialNodes);
      setEdges([]);
      setSaveStatus("saved");
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [setNodes, setEdges, getAccessToken]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  const saveMap = useCallback(async (currentNodes, currentEdges) => {
    if (!sessionId || !hasLoaded) return;
    if (currentNodes.length === 0) return;
    
    setSaveStatus("saving");
    
    try {
      const token = await getAccessToken();
      await saveMindMap(sessionId, currentNodes, currentEdges, token);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error saving map:", error);
      if (error.message?.includes("401")) {
        setSaveStatus("error");
        toast.error("Session expired. Please log in again.");
      } else {
        setSaveStatus("error");
        toast.error("Failed to save changes");
      }
    }
  }, [sessionId, hasLoaded, getAccessToken]);

  useEffect(() => {
    if (!sessionId || !hasLoaded) return;
    if (isPlaceholderNode(nodes)) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      saveMap(nodes, edges);
    }, 500);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [nodes, edges, sessionId, saveMap, hasLoaded]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = useCallback(() => {
    nodeCounter += 1;
    
    const newNode = {
      id: `node-${Date.now()}`,
      position: { x: 250 + (nodeCounter * 50) % 200, y: 250 + (nodeCounter * 50) % 200 },
      data: { label: "New Node" },
      type: "editableNode",
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const handleClearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  const handleNodeClick = useCallback((event, node) => {
    if (event.shiftKey) {
      if (edgeSource === null) {
        setEdgeSource(node.id);
        toast.info("Select second node to connect", { duration: 2000 });
      } else if (edgeSource !== node.id) {
        setEdges((eds) => addEdge({ source: edgeSource, target: node.id }, eds));
        toast.success("Edge created", { duration: 2000 });
        setEdgeSource(null);
      }
    }
  }, [edgeSource, setEdges]);

  const handleGetHint = async () => {
    if (isPlaceholderNode(nodes) || nodes.length === 0) {
      toast.error("Add some nodes to the map first");
      return;
    }
    
    setIsGeneratingHint(true);
    
    try {
      const token = await getAccessToken();
      let fullHint = "";
      await getSocraticHintStream(
        sessionId,
        nodes,
        edges,
        (chunk) => {
          fullHint += chunk;
        },
        token
      );
      if (fullHint && onAddHint) {
        onAddHint(fullHint);
      }
    } catch (error) {
      console.error("Error getting hint:", error);
      if (error.message?.includes("401")) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(error.message || "Failed to get hint");
      }
    } finally {
      setIsGeneratingHint(false);
    }
  };

  const retrySave = () => {
    saveMap(nodes, edges);
  };

  const selectedNodeCount = nodes.filter((n) => n.selected).length;

  return (
    <div className="h-full w-full bg-slate-900 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-slate-400 text-sm">Loading session...</p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap zoomable pannable />
        <Background variant="dots" gap={12} size={1} color="#334155" />
      </ReactFlow>
      
      <Toolbar 
        onAddNode={handleAddNode} 
        onClearAll={handleClearAll}
        onDeleteSelected={handleDeleteSelected}
        nodeCount={nodes.length}
        selectedNodeCount={selectedNodeCount}
        onGetHint={handleGetHint}
        hints={hints}
        isGeneratingHint={isGeneratingHint}
      />

      <div className="absolute bottom-4 right-4 z-20">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            saveStatus === "saved"
              ? "bg-emerald-900/50 text-emerald-400"
              : saveStatus === "saving"
              ? "bg-amber-900/50 text-amber-400"
              : "bg-red-900/50 text-red-400"
          }`}
        >
          {saveStatus === "saved" && <Check className="w-3 h-3" />}
          {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
          {saveStatus === "error" && (
            <button onClick={retrySave} className="hover:underline flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Retry
            </button>
          )}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "error" && "Error"}
        </div>
      </div>
    </div>
  );
};

export default MapCanvas;
