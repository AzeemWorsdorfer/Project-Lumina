import type { Node, Edge } from "@xyflow/react";

export type Theme = "light" | "dark";

export type NodeColorKey =
  | "yellow" | "blue" | "green" | "pink"
  | "purple" | "orange" | "gray" | "red";

export interface BackendMindMapNode {
  id: string;
  label: string;
  node_type: string;
  color: string;
  position: { x: number; y: number };
  related_source_chunk_id: string | null;
  width: number | null;
  height: number | null;
}

export interface BackendMindMapEdge {
  id: string;
  source: string;
  target: string;
  label: string | null;
  edge_type: string;
  color: string;
}

export interface MindMapNodeData {
  label: string;
  nodeType: string;
  color: string;
  related_source_chunk_id: string | null;
}

export type MindMapNode = Node<MindMapNodeData>;
export type MindMapEdge = Edge;

export interface Session {
  id: string;
  title: string;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface SocraticHint {
  hint_text: string;
  related_concept: string;
}
