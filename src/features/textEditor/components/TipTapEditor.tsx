import './TipTapEditor.css';

import { Editor, EditorContent, JSONContent } from '@tiptap/react';
import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

import { selectionAtom } from '../../../atoms/selectionState';
import { EditorContentAtoms } from '../../../atoms/types/EditorContentAtoms';
import { MenuBar } from './MenuBar';
import { EDITOR_EXTENSIONS, INITIAL_CONTENT, transformPasted } from './tipTapEditorConfigs';

interface EditorProps {
  editorContent: string | JSONContent | null;
  activeEditorContentAtoms: EditorContentAtoms;
}

export function TipTapEditor({ editorContent, activeEditorContentAtoms }: EditorProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const setSelection = useSetAtom(selectionAtom);

  const { updateEditorContentBufferAtom: updateFileBufferAtom, saveEditorContentInMemoryAtom: saveFileInMemoryAtom } =
    activeEditorContentAtoms;

  const updateFileBuffer = useSetAtom(updateFileBufferAtom);
  const saveFileInMemory = useSetAtom(saveFileInMemoryAtom);

  useEffect(() => {
    const newEditor = new Editor({
      extensions: EDITOR_EXTENSIONS,
      content: editorContent ?? INITIAL_CONTENT,
      onSelectionUpdate: (update) => {
        const updatedEditor = update.editor;
        const { from, to } = updatedEditor.view.state.selection;
        const text = updatedEditor.view.state.doc.textBetween(from, to);
        setSelection(text);
      },
      editorProps: {
        transformPasted,
      },
      onUpdate: ({ editor: updatedEditor }) => {
        updateFileBuffer({ type: 'text', textContent: updatedEditor.storage.markdown.getMarkdown() as string });
      },
    });
    setEditor(newEditor);
    return () => {
      saveFileInMemory();
      newEditor.destroy();
    };
  }, [editorContent, setSelection, saveFileInMemory, updateFileBuffer]);

  if (!editor) {
    return <div>...</div>;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <MenuBar editor={editor} />
      <EditorContent className="tiptap-editor" editor={editor} />
    </div>
  );
}