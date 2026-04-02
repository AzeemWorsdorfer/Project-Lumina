import React, { useState, useCallback } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";

const EditableNode = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(data.label);
  const { setNodes } = useReactFlow();

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== data.label) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, label: trimmed } } : node
        )
      );
    }
  }, [value, data.label, id, setNodes]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleBlur();
      } else if (e.key === "Escape") {
        setValue(data.label);
        setIsEditing(false);
      }
    },
    [handleBlur, data.label]
  );

  return (
    <div
      className={`px-4 py-2 bg-slate-800 border-2 rounded-lg min-w-30 text-center transition-colors ${
        selected
          ? "border-amber-500 shadow-lg shadow-amber-500/20"
          : "border-slate-600 hover:border-amber-500/50"
      }`}
      onDoubleClick={handleDoubleClick}
      style={data.style}
    >
      <Handle type="target" position={Position.Top} className="bg-slate-400!" />
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full bg-transparent text-slate-200 text-base text-center outline-none border-b border-amber-500"
        />
      ) : (
        <span className="text-slate-200 text-base font-medium">{data.label}</span>
      )}
      <Handle type="source" position={Position.Bottom} className="bg-slate-400!" />
    </div>
  );
};

export default EditableNode;
