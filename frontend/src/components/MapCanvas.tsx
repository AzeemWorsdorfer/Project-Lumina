import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Connection,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { fetchSession, saveMindMap, getSocraticHintStream, generateQuiz } from "../services/api";
import { backendToReactFlow, DEFAULT_NODE_COLOR, DEFAULT_NODE_TYPE, DEFAULT_EDGE_TYPE } from "../utils/mapTransform";
import { toast } from "sonner";
import { Loader2, Check, AlertCircle } from "lucide-react";
import Toolbar from "./Toolbar";
import EditableNode from "./EditableNode";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import type { MindMapNode, MindMapEdge, MindMapNodeData, Quiz } from "../types";

const nodeTypes = { textCard: EditableNode, stickyNote: EditableNode };

const initialNodes: MindMapNode[] = [];
const initialEdges: MindMapEdge[] = [];

type SaveStatus = "saved" | "saving" | "error";

interface MapSnapshot {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

interface MapCanvasProps {
  sessionId: string;
  hints: string[];
  onAddHint: (hint: string) => void;
  quizzes: Quiz[];
  onAddQuiz: (quiz: Quiz) => void;
}

const isPlaceholderNode = (nodes: MindMapNode[]): boolean => {
  return nodes.length === 1 && nodes[0]?.data?.label === "Select a Session";
};

const getDraftKey = (sessionId: string): string => `lumina-mindmap-draft-${sessionId}`;

const parseDraft = (value: string | null): { nodes: MindMapNode[]; edges: MindMapEdge[] } | null => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

let nodeCounter = 0;

const MapCanvas = ({ sessionId, hints, onAddHint, quizzes, onAddQuiz }: MapCanvasProps) => {
  const { getAccessToken } = useAuth();
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const historyRef = useRef<{ stack: MapSnapshot[]; index: number }>({ stack: [], index: -1 });
  const MAX_HISTORY = 50;
  const isUndoingRedoing = useRef(false);

  const takeSnapshot = useCallback(
    (nextNodes?: MindMapNode[], nextEdges?: MindMapEdge[]) => {
      if (isUndoingRedoing.current) return;
      const { stack, index } = historyRef.current;
      const snapshot: MapSnapshot = {
        nodes: JSON.parse(JSON.stringify(nextNodes ?? nodes)),
        edges: JSON.parse(JSON.stringify(nextEdges ?? edges)),
      };
      const newStack = stack.slice(0, index + 1);
      newStack.push(snapshot);
      while (newStack.length > MAX_HISTORY) newStack.shift();
      historyRef.current = { stack: newStack, index: newStack.length - 1 };
    },
    [nodes, edges]
  );

  const handleUndo = useCallback(() => {
    const { stack, index } = historyRef.current;
    if (index <= 0) return;
    isUndoingRedoing.current = true;
    const newIndex = index - 1;
    setNodes(stack[newIndex].nodes);
    setEdges(stack[newIndex].edges);
    historyRef.current = { stack, index: newIndex };
    setTimeout(() => { isUndoingRedoing.current = false; }, 0);
  }, [setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const { stack, index } = historyRef.current;
    if (index >= stack.length - 1) return;
    isUndoingRedoing.current = true;
    const newIndex = index + 1;
    const snapshot = stack[newIndex];
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    historyRef.current = { stack, index: newIndex };
    setTimeout(() => { isUndoingRedoing.current = false; }, 0);
  }, [setNodes, setEdges]);

  const loadSession = useCallback(async (id: string) => {
    if (!id) return;

    setIsLoading(true);
    setSaveStatus("saved");
    setHasLoaded(false);

    try {
      const token = await getAccessToken();
      const session = await fetchSession(id, token);

      const draft = parseDraft(localStorage.getItem(getDraftKey(id)));
      const hasDraft = draft?.nodes && draft.nodes.length > 0 || (draft?.edges && draft.edges.length > 0);

      if (hasDraft) {
        setNodes(draft!.nodes || initialNodes);
        setEdges(draft!.edges || initialEdges);
      } else if (session.mind_map_data && session.mind_map_data.nodes?.length > 0) {
        const { nodes: savedNodes, edges: savedEdges } = backendToReactFlow(
          session.mind_map_data
        );
        setNodes(savedNodes);
        setEdges(savedEdges);
      } else {
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error loading session:", error);
      if ((error as Error).message?.includes("401")) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to load session data");
      }
      setNodes(initialNodes);
      setEdges(initialEdges);
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

  const saveMap = useCallback(async (currentNodes: MindMapNode[], currentEdges: MindMapEdge[]) => {
    if (!sessionId || !hasLoaded) return;
    if (currentNodes.length === 0) return;

    setSaveStatus("saving");

    try {
      const token = await getAccessToken();
      await saveMindMap({ sessionId, nodes: currentNodes, edges: currentEdges, token });
      localStorage.removeItem(getDraftKey(sessionId));
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error saving map:", error);
      if ((error as Error).message?.includes("401")) {
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

    try {
      localStorage.setItem(
        getDraftKey(sessionId),
        JSON.stringify({ nodes, edges })
      );
    } catch (error) {
      console.warn("Unable to save draft to localStorage:", error);
    }

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

  const handleAddNode = useCallback((nodeType: string = DEFAULT_NODE_TYPE, color: string = DEFAULT_NODE_COLOR, position: { x: number; y: number } | null = null) => {
    nodeCounter += 1;

    const pos = position || {
      x: 250 + (nodeCounter * 50) % 200,
      y: 250 + (nodeCounter * 50) % 200,
    };

    const newNode: MindMapNode = {
      id: `node-${Date.now()}-${nodeCounter}`,
      position: pos,
      type: nodeType,
      data: {
        label: "New Card",
        nodeType: nodeType,
        color: color,
        related_source_chunk_id: null,
      },
    };

    takeSnapshot([...nodes, newNode]);
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes, takeSnapshot]);

  const handleAddChild = useCallback(() => {
    const selected = nodes.find((n) => n.selected);
    if (!selected) {
      toast.info("Select a parent node first");
      return;
    }
    nodeCounter += 1;
    const childNode: MindMapNode = {
      id: `node-${Date.now()}-${nodeCounter}`,
      type: DEFAULT_NODE_TYPE,
      position: {
        x: selected.position.x + (nodeCounter * 50) % 300,
        y: selected.position.y + 200 + (nodeCounter * 30) % 100,
      },
      data: {
        label: "New Card",
        nodeType: DEFAULT_NODE_TYPE,
        color: DEFAULT_NODE_COLOR,
        related_source_chunk_id: null,
      },
    };
    const childEdge: MindMapEdge = {
      id: `edge-${Date.now()}-${nodeCounter}`,
      source: selected.id,
      target: childNode.id,
      type: DEFAULT_EDGE_TYPE,
      markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15 },
    };
    takeSnapshot([...nodes, childNode], [...edges, childEdge]);
    setNodes((nds) => [...nds, childNode]);
    setEdges((eds) => [...eds, childEdge]);
  }, [nodes, edges, takeSnapshot, setNodes, setEdges]);

  const handleAddSibling = useCallback(() => {
    const selected = nodes.find((n) => n.selected);
    if (!selected) {
      handleAddNode();
      return;
    }
    nodeCounter += 1;
    const siblingNode: MindMapNode = {
      id: `node-${Date.now()}-${nodeCounter}`,
      type: DEFAULT_NODE_TYPE,
      position: {
        x: selected.position.x + 250 + (nodeCounter * 40) % 200,
        y: selected.position.y,
      },
      data: {
        label: "New Card",
        nodeType: DEFAULT_NODE_TYPE,
        color: DEFAULT_NODE_COLOR,
        related_source_chunk_id: null,
      },
    };
    takeSnapshot([...nodes, siblingNode]);
    setNodes((nds) => [...nds, siblingNode]);
  }, [nodes, handleAddNode, takeSnapshot, setNodes]);

  const handleEditNode = useCallback(() => {
    const selected = nodes.find((n) => n.selected);
    if (!selected) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selected.id
          ? { ...n, data: { ...n.data, _editRequest: Date.now() } }
          : n
      )
    );
  }, [nodes, setNodes]);

  const handleDeselectAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: false }))
    );
    setEdges((eds) =>
      eds.map((e) => ({ ...e, selected: false }))
    );
    if (edgeSource) setEdgeSource(null);
  }, [setNodes, setEdges, edgeSource]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: DEFAULT_EDGE_TYPE as const,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
        },
      };
      const nextEdges = addEdge(newEdge, edges);
      takeSnapshot(nodes, nextEdges);
      setEdges(nextEdges);
    },
    [nodes, edges, setEdges, takeSnapshot]
  );

  const handleClearAll = useCallback(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    takeSnapshot([], []);
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges, nodes, edges, takeSnapshot]);

  const handleDeleteSelected = useCallback(() => {
    const hasSelected = nodes.some((n) => n.selected) || edges.some((e) => e.selected);
    if (!hasSelected) return;
    takeSnapshot(
      nodes.filter((node) => !node.selected),
      edges.filter((edge) => !edge.selected)
    );
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges, nodes, edges, takeSnapshot]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: MindMapNode) => {
    if (event.shiftKey) {
      if (edgeSource === null) {
        setEdgeSource(node.id);
        toast.info("Select second node to connect", { duration: 2000 });
      } else if (edgeSource !== node.id) {
        const newEdge = {
          source: edgeSource,
          target: node.id,
          type: DEFAULT_EDGE_TYPE as const,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
          },
        };
        const nextEdges = addEdge(newEdge, edges);
        takeSnapshot(nodes, nextEdges);
        setEdges(nextEdges);
        toast.success("Edge created", { duration: 2000 });
        setEdgeSource(null);
      }
    }
  }, [edgeSource, nodes, edges, setEdges, takeSnapshot]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: MindMapEdge) => {
    if (event.shiftKey) {
      const label = prompt("Enter edge label (or leave empty to remove):");
      if (label !== null) {
        const nextEdges = edges.map((e) =>
            e.id === edge.id ? { ...e, label: label || undefined } : e
          );
          takeSnapshot(nodes, nextEdges);
          setEdges(nextEdges);
      }
    }
  }, [nodes, edges, setEdges, takeSnapshot]);

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
        { sessionId, nodes, edges, token },
        (chunk: string) => {
          fullHint += chunk;
        },
      );
      if (fullHint && onAddHint) {
        onAddHint(fullHint);
      }
    } catch (error) {
      console.error("Error getting hint:", error);
      if ((error as Error).message?.includes("401")) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error((error as Error).message || "Failed to get hint");
      }
    } finally {
      setIsGeneratingHint(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (isPlaceholderNode(nodes) || nodes.length === 0) {
      toast.error("Add some nodes to the map first");
      return;
    }

    setIsGeneratingQuiz(true);

    try {
      const token = await getAccessToken();
      const quizData = await generateQuiz({ sessionId, nodes, edges, token });
      if (quizData && onAddQuiz) {
        onAddQuiz(quizData);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      if ((error as Error).message?.includes("401")) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error((error as Error).message || "Failed to generate quiz");
      }
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const retrySave = () => {
    saveMap(nodes, edges);
  };

  useKeyboardShortcuts({
    onDelete: handleDeleteSelected,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onAddChild: handleAddChild,
    onAddSibling: handleAddSibling,
    onDeselectAll: handleDeselectAll,
    onEditNode: handleEditNode,
    onSave: () => saveMap(nodes, edges),
  });

  const selectedNodeCount = nodes.filter((n) => n.selected).length;
  const selectedEdgeCount = edges.filter((e) => e.selected).length;

  const bgColor = theme === "dark" ? "#1e293b" : "#334155";

  return (
    <div className="h-full w-full bg-primary relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-secondary text-sm">Loading session...</p>
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
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        zoomOnDoubleClick={false}
        onInit={(instance: ReactFlowInstance) => { reactFlowInstance.current = instance; }}
        onDoubleClick={(event: React.MouseEvent) => {
          if ((event.target as HTMLElement).closest(".react-flow__node")) return;
          if (!reactFlowInstance.current) return;
          const position = reactFlowInstance.current.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          handleAddNode(DEFAULT_NODE_TYPE, DEFAULT_NODE_COLOR, position);
        }}
        colorMode={theme}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: DEFAULT_EDGE_TYPE as const,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
          },
        }}
      >
        <Controls />
        <MiniMap
          zoomable
          pannable
          nodeColor={(node: MindMapNode) => node.data?.color || DEFAULT_NODE_COLOR}
        />
        <Background variant="dots" gap={12} size={1} color={bgColor} />
      </ReactFlow>

      <Toolbar
        onAddNode={handleAddNode}
        onClearAll={handleClearAll}
        onDeleteSelected={handleDeleteSelected}
        nodeCount={nodes.length}
        selectedNodeCount={selectedNodeCount}
        selectedEdgeCount={selectedEdgeCount}
        onGetHint={handleGetHint}
        hints={hints}
        isGeneratingHint={isGeneratingHint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onGenerateQuiz={handleGenerateQuiz}
        quizzes={quizzes}
        isGeneratingQuiz={isGeneratingQuiz}
      />

      <div className="absolute bottom-4 right-4 z-20">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition duration-150 ease-out-expo ${
            saveStatus === "saved"
              ? "bg-success-subtle text-success"
              : saveStatus === "saving"
              ? "bg-accent-subtle text-accent"
              : "bg-destructive-subtle text-destructive"
          }`}
        >
          {saveStatus === "saved" && <Check className="w-3 h-3" />}
          {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
          {saveStatus === "error" && (
            <button onClick={retrySave} className="hover:underline flex items-center gap-1" aria-label="Retry save">
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
