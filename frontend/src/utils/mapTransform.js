export const backendToReactFlow = (mindMapData) => {
  if (!mindMapData || !mindMapData.nodes || !mindMapData.edges) {
    return { nodes: [], edges: [] };
  }

  const nodes = mindMapData.nodes.map((node) => ({
    id: node.id,
    type: node.type || "default",
    position: node.position,
    data: {
      label: node.label,
      related_source_chunk_id: node.related_source_chunk_id || null,
    },
  }));

  const edges = mindMapData.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label || undefined,
    type: "default",
    animated: false,
  }));

  return { nodes, edges };
};

export const reactFlowToBackend = (nodes, edges) => {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.data?.label || "",
      position: node.position,
      related_source_chunk_id: node.data?.related_source_chunk_id || null,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || null,
    })),
  };
};
