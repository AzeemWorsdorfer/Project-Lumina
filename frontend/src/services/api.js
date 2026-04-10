import { API_BASE_URL } from "../config.js";

async function authFetch(url, options = {}, token = null) {
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.detail || `Request failed: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  
  return response;
}

const DEFAULT_NODE_TYPE = "textCard";
const DEFAULT_NODE_COLOR = "#fbbf24";
const DEFAULT_EDGE_TYPE = "smoothstep";
const DEFAULT_EDGE_COLOR = "#64748b";

const nodeToBackend = (node) => ({
  id: node.id,
  label: node.data?.nodeType === "textCard" && !node.data?.label ? "Untitled" : (node.data?.label || ""),
  node_type: node.data?.nodeType || DEFAULT_NODE_TYPE,
  color: node.data?.color || DEFAULT_NODE_COLOR,
  position: node.position,
  related_source_chunk_id: node.data?.related_source_chunk_id || null,
  width: node.data?.width || null,
  height: node.data?.height || null,
});

const edgeToBackend = (edge) => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  label: edge.label || null,
  edge_type: edge.type || DEFAULT_EDGE_TYPE,
  color: edge.style?.stroke || DEFAULT_EDGE_COLOR,
});

export const fetchSession = async (sessionId, token = null) => {
  const response = await authFetch(
    `${API_BASE_URL}/api/v1/session/${sessionId}`,
    {},
    token
  );
  return response.json();
};

export const fetchPdfUrl = async (sessionId, token = null) => {
  const response = await authFetch(
    `${API_BASE_URL}/api/v1/session/${sessionId}/pdf-url`,
    {},
    token
  );
  const data = await response.json();
  return data.url;
};

export const saveMindMap = async (sessionId, nodes, edges, token = null) => {
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
    token
  );

  return response.json();
};

export const getSocraticHint = async (sessionId, nodes, edges, token = null) => {
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
    token
  );

  return response.json();
};

export const getSocraticHintStream = async (sessionId, nodes, edges, onChunk, token = null) => {
  const backendNodes = nodes.map(nodeToBackend);
  const backendEdges = edges.map(edgeToBackend);

  const headers = {
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
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to get hint: ${response.statusText}`);
  }

  const reader = response.body.getReader();
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
