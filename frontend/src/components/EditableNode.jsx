import React, { useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { getContrastColor } from "../utils/mapTransform.js";

const EditableNode = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(data.label || "");
  const inputRef = useRef(null);
  const editRequestRef = useRef(data._editRequest);
  const { setNodes } = useReactFlow();

  const nodeType = data.nodeType || "textCard";
  const color = data.color || "#fbbf24";
  const textColor = getContrastColor(color);

  useEffect(() => {
    if (data._editRequest && data._editRequest !== editRequestRef.current) {
      editRequestRef.current = data._editRequest;
      setValue(data.label || "");
      setIsEditing(true);
    }
  }, [data._editRequest, data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setValue(data.label || "");
    setIsEditing(true);
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const trimmed = value.trim() || "Untitled";
    setValue(trimmed);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label: trimmed } }
          : node,
      ),
    );
  }, [value, id, setNodes]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleBlur();
      } else if (e.key === "Escape") {
        setValue(data.label || "");
        setIsEditing(false);
      }
    },
    [handleBlur, data.label],
  );

  const handleChange = useCallback(
    (e) => {
      const nextValue = e.target.value;
      setValue(nextValue);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: nextValue || "Untitled" } }
            : node,
        ),
      );
    },
    [id, setNodes],
  );

  if (nodeType === "stickyNote") {
    return (
      <div
        className={`rounded-lg shadow-lg transition duration-200 ease-out-expo ${
          selected
            ? "ring-2 ring-accent ring-offset-2 scale-105"
            : ""
        }`}
        style={{
          backgroundColor: color,
          minWidth: 160,
          minHeight: 120,
          maxWidth: 200,
          width: data.width || 180,
        }}
        onDoubleClick={handleDoubleClick}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!opacity-0"
        />
        <div className="p-3 h-full">
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full min-h-20 bg-transparent resize-none outline-none text-sm font-serif"
              style={{ color: textColor }}
              placeholder="Type something..."
            />
          ) : (
            <p
              className="text-sm whitespace-pre-wrap wrap-break-words cursor-text font-serif"
              style={{ color: textColor }}
            >
              {data.label || "Double-click to edit"}
            </p>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!opacity-0"
        />
      </div>
    );
  }

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 transition duration-200 ease-out-expo ${
        selected
          ? "border-accent shadow-lg"
          : "border-default hover:border-accent/50"
      }`}
      style={{
        backgroundColor: color,
        minWidth: 200,
        maxWidth: 320,
        width: data.width || undefined,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} style={{ backgroundColor: "var(--text-muted)" }} />
      <div className="text-center">
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-base text-center outline-none resize-none border-b-2 border-accent min-h-8"
            style={{ color: textColor }}
            rows={2}
            placeholder="Enter text..."
          />
        ) : (
          <p className="text-base font-serif" style={{ color: textColor }}>
            {data.label || "Untitled"}
          </p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ backgroundColor: "var(--text-muted)" }}
      />
    </div>
  );
};

export default EditableNode;
