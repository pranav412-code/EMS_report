"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useEffect } from "react";

type EditableFieldProps = {
  id: string;
  value: string;
  onChange: (id: string, value: string) => void;
  type?: "text" | "textarea" | "richtext";
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
  disabled?: boolean;
  placeholder?: string;
};

const EditableField: React.FC<EditableFieldProps> = ({
  id,
  value,
  onChange,
  type = "text",
  className,
  tag = "div",
  disabled = false,
  placeholder,
}) => {
  const ref = useRef<any>(null);

  const isContentEditable = type === 'richtext' || (type === 'text' && tag !== 'div');

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    if (disabled) return;
    const newValue = e.currentTarget.innerHTML;
    onChange(id, newValue);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (disabled) return;
    onChange(id, e.target.value);
  };

  // For auto-resizing textarea
  useEffect(() => {
    if (type === "textarea" && ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value, type]);
  
  // This is needed to prevent cursor jumping in contentEditable elements
  useEffect(() => {
      if (ref.current && isContentEditable) {
        if (ref.current.innerHTML !== value) {
            ref.current.innerHTML = value;
        }
    }
  }, [value, isContentEditable]);


  // Handle paste as plain text
  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");

    if (ref.current && ref.current.isContentEditable) {
        document.execCommand("insertText", false, text);
    } else if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      const newValue = value.substring(0, start) + text + value.substring(end);
      onChange(id, newValue);
      // Move cursor after pasted text
      setTimeout(() => {
        ref.current.selectionStart = ref.current.selectionEnd = start + text.length;
      }, 0);
    }
  };

  if (isContentEditable) {
      const Component = tag;
      return (
        <Component
          ref={ref}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          className={cn("editable-field", disabled && "cursor-not-allowed", className)}
          dangerouslySetInnerHTML={{ __html: value }}
        />
    );
  }

  if (type === "textarea") {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={handleTextChange}
        onPaste={handlePaste}
        className={cn("editable-field resize-none overflow-hidden", className)}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
      />
    );
  }

  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={handleTextChange}
      onPaste={handlePaste}
      className={cn("editable-field", className)}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
};

export default React.memo(EditableField);