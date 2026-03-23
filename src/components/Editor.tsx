"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useImperativeHandle, forwardRef } from "react";

export interface EditorHandle {
  setContent: (html: string) => void;
}

interface EditorProps {
  content: string;
  onUpdate: (html: string, text: string) => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ content, onUpdate }, ref) => {
  const initialContent = useRef(content);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: initialContent.current,
    editorProps: {
      attributes: {
        class: "prose prose-neutral max-w-none focus:outline-none min-h-[60vh] text-base leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML(), editor.getText());
    },
  });

  useImperativeHandle(ref, () => ({
    setContent: (html: string) => {
      if (editor && html !== editor.getHTML()) {
        editor.commands.setContent(html);
      }
    },
  }), [editor]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
});

Editor.displayName = "Editor";
export default Editor;
