import type { Node, Edge } from "@xyflow/react";
import type {
  BackendMindMapNode,
  BackendMindMapEdge,
  MindMapNodeData,
  QuizQuestion,
  Quiz,
} from "../types";
import { API_BASE_URL } from "../config";
import {
  DEFAULT_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_EDGE_TYPE,
  DEFAULT_EDGE_COLOR,
} from "../utils/mapTransform";

interface SessionResponse {
  id: string;
  mind_map_data?: {
    nodes: BackendMindMapNode[];
    edges: BackendMindMapEdge[];
  } | null;
}

interface SaveMindMapResponse {
  status: string;
  message: string;
}

interface SocraticHintResponse {
  hint_text: string;
  suggested_node_id: string | null;
  type: string;
}

async function authFetch(
  url: string,
  options: RequestInit = {},
  token: string | null = null,
): Promise<Response> {
  const headers: Record<string, string> = {};

  if (options.headers) {
    const h = options.headers as Record<string, string>;
    for (const key in h) {
      if (Object.prototype.hasOwnProperty.call(h, key)) {
        headers[key] = h[key];
      }
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error: { detail?: string } = await response.json().catch(() => ({}));
    const err = new Error(
      error.detail || `Request failed: ${response.statusText}`,
    ) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  return response;
}

const nodeToBackend = (
  node: Node<MindMapNodeData>,
): BackendMindMapNode => ({
  id: node.id,
  label: node.data?.label || "Untitled",
  node_type: node.data?.nodeType || DEFAULT_NODE_TYPE,
  color: node.data?.color || DEFAULT_NODE_COLOR,
  position: node.position,
  related_source_chunk_id: node.data?.related_source_chunk_id || null,
  width: node.data?.width || null,
  height: node.data?.height || null,
});

const edgeToBackend = (edge: Edge): BackendMindMapEdge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  label: edge.label || null,
  edge_type: edge.type || DEFAULT_EDGE_TYPE,
  color: edge.style?.stroke || DEFAULT_EDGE_COLOR,
});

export const fetchSession = async (
  sessionId: string,
  token: string | null = null,
): Promise<SessionResponse> => {
  const response = await authFetch(
    `${API_BASE_URL}/api/v1/session/${sessionId}`,
    {},
    token,
  );
  return response.json();
};

export const fetchPdfUrl = async (
  sessionId: string,
  token: string | null = null,
): Promise<string> => {
  const response = await authFetch(
    `${API_BASE_URL}/api/v1/session/${sessionId}/pdf-url`,
    {},
    token,
  );
  const data: { url: string } = await response.json();
  return data.url;
};

export const saveMindMap = async (
  sessionId: string,
  nodes: Node<MindMapNodeData>[],
  edges: Edge[],
  token: string | null = null,
): Promise<SaveMindMapResponse> => {
  const backendNodes = nodes.map(nodeToBackend);
  const backendEdges = edges.map(edgeToBackend);

  const response = await authFetch(
    `${API_BASE_URL}/api/v1/${sessionId}/map`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        nodes: backendNodes,
        edges: backendEdges,
      }),
    },
    token,
  );

  return response.json();
};

export const getSocraticHint = async (
  sessionId: string,
  nodes: Node<MindMapNodeData>[],
  edges: Edge[],
  token: string | null = null,
): Promise<SocraticHintResponse> => {
  const backendNodes = nodes.map(nodeToBackend);
  const backendEdges = edges.map(edgeToBackend);

  const response = await authFetch(
    `${API_BASE_URL}/api/v1/get-socratic-hint`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        nodes: backendNodes,
        edges: backendEdges,
      }),
    },
    token,
  );

  return response.json();
};

export const getSocraticHintStream = async (
  sessionId: string,
  nodes: Node<MindMapNodeData>[],
  edges: Edge[],
  onChunk: ((chunk: string) => void) | null = null,
  token: string | null = null,
): Promise<string> => {
  const backendNodes = nodes.map(nodeToBackend);
  const backendEdges = edges.map(edgeToBackend);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/get-socratic-hint-stream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        session_id: sessionId,
        nodes: backendNodes,
        edges: backendEdges,
      }),
    },
  );

  if (!response.ok) {
    const error: { detail?: string } = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `Failed to get hint: ${response.statusText}`,
    );
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          return fullResponse;
        }
        fullResponse += data;
        if (onChunk) {
          onChunk(data);
        }
      }
    }
  }

  return fullResponse;
};

export const generateQuiz = async (
  sessionId: string,
  nodes: Node<MindMapNodeData>[],
  edges: Edge[],
  token: string | null = null,
): Promise<Quiz> => {
  const backendNodes = nodes.map(nodeToBackend);
  const backendEdges = edges.map(edgeToBackend);

  const response = await authFetch(
    `${API_BASE_URL}/api/v1/generate-quiz`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        nodes: backendNodes,
        edges: backendEdges,
      }),
    },
    token,
  );

  return response.json();
};
