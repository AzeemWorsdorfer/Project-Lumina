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
  reactFlowToBackend,
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

export const buildAuthHeaders = (
  token: string | null,
  extraHeaders?: Record<string, string>,
): Record<string, string> => {
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export interface MindMapRequestContext {
  sessionId: string;
  nodes: Node<MindMapNodeData>[];
  edges: Edge[];
  token: string | null;
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

  const authHeaders = buildAuthHeaders(token, headers);

  const response = await fetch(url, { ...options, headers: authHeaders });

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

export const saveMindMap = async ({
  sessionId,
  nodes,
  edges,
  token,
}: MindMapRequestContext): Promise<SaveMindMapResponse> => {
  const { nodes: backendNodes, edges: backendEdges } = reactFlowToBackend(nodes, edges);

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

export const getSocraticHint = async ({
  sessionId,
  nodes,
  edges,
  token,
}: MindMapRequestContext): Promise<SocraticHintResponse> => {
  const { nodes: backendNodes, edges: backendEdges } = reactFlowToBackend(nodes, edges);

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

export const getSocraticHintStream = async ({
  sessionId,
  nodes,
  edges,
  token,
}: MindMapRequestContext, onChunk: ((chunk: string) => void) | null = null): Promise<string> => {
  const { nodes: backendNodes, edges: backendEdges } = reactFlowToBackend(nodes, edges);

  const headers = buildAuthHeaders(token, {
    "Content-Type": "application/json",
  });

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

export const generateQuiz = async ({
  sessionId,
  nodes,
  edges,
  token,
}: MindMapRequestContext): Promise<Quiz> => {
  const { nodes: backendNodes, edges: backendEdges } = reactFlowToBackend(nodes, edges);

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
