import type { Node, Edge } from "@xyflow/react";
import type {
  BackendMindMapNode,
  BackendMindMapEdge,
  MindMapNodeData,
  NodeColorKey,
} from "../types";

export const NODE_COLORS: Record<NodeColorKey, string> = {
  yellow: "#fbbf24",
  blue: "#60a5fa",
  green: "#4ade80",
  pink: "#f472b6",
  purple: "#a78bfa",
  orange: "#fb923c",
  gray: "#94a3b8",
  red: "#f87171",
};

export const NODE_COLORS_LIGHT: Record<NodeColorKey, string> = {
  yellow: "#eab308",
  blue: "#3b82f6",
  green: "#22c55e",
  pink: "#db2777",
  purple: "#7c3aed",
  orange: "#ea580c",
  gray: "#64748b",
  red: "#dc2626",
};

export const DEFAULT_NODE_COLOR = "#fbbf24";
export const DEFAULT_NODE_TYPE = "textCard";
export const DEFAULT_EDGE_TYPE = "default";
export const DEFAULT_EDGE_COLOR = "#64748b";

interface BackendMindMapData {
  nodes: BackendMindMapNode[];
  edges: BackendMindMapEdge[];
}

interface ReactFlowMindMapData {
  nodes: Node<MindMapNodeData>[];
  edges: Edge[];
}

export const backendToReactFlow = (mindMapData: BackendMindMapData): ReactFlowMindMapData => {
  if (!mindMapData || !mindMapData.nodes || !mindMapData.edges) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node<MindMapNodeData>[] = mindMapData.nodes.map((node) => ({
    id: node.id,
    type: node.node_type || "textCard",
    position: node.position,
    data: {
      label: node.label,
      nodeType: node.node_type || "textCard",
      color: node.color || DEFAULT_NODE_COLOR,
      related_source_chunk_id: node.related_source_chunk_id || null,
      width: node.width || null,
      height: node.height || null,
    },
    style: {
      width: node.width || undefined,
      height: node.height || undefined,
    },
  }));

  const edges: Edge[] = mindMapData.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label || undefined,
    type: edge.edge_type || "default",
    style: { stroke: edge.color || DEFAULT_EDGE_COLOR },
    animated: false,
  }));

  return { nodes, edges };
};

export const reactFlowToBackend = (
  nodes: Node<MindMapNodeData>[],
  edges: Edge[]
): { nodes: BackendMindMapNode[]; edges: BackendMindMapEdge[] } => {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.data?.label || "Untitled",
      node_type: node.data?.nodeType || DEFAULT_NODE_TYPE,
      color: node.data?.color || DEFAULT_NODE_COLOR,
      position: node.position,
      related_source_chunk_id: node.data?.related_source_chunk_id || null,
      width: node.data?.width || null,
      height: node.data?.height || null,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || null,
      edge_type: edge.type || DEFAULT_EDGE_TYPE,
      color: edge.style?.stroke || DEFAULT_EDGE_COLOR,
    })),
  };
};

export const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0f172a" : "#ffffff";
};
