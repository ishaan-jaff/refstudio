import { act, waitFor } from '@testing-library/react';
import { createStore } from 'jotai';
import { Loadable } from 'jotai/vanilla/utils/loadable';

import { readAllProjectFiles, readFileContent, writeFileContent } from '../../io/filesystem';
import { activePaneAtom, closeEditorFromPaneAtom, moveEditorToPaneAtom } from '../editorActions';
import { openFileEntryAtom } from '../fileEntryActions';
import { useActiveEditorContentAtoms } from '../hooks/useActiveEditorContentAtoms';
import { useActiveEditorId } from '../hooks/useActiveEditorId';
import { focusPaneAtom } from '../paneActions';
import { EditorContent } from '../types/EditorContent';
import { EditorContentAtoms } from '../types/EditorContentAtoms';
import { buildEditorId, EditorData } from '../types/EditorData';
import { FileFileEntry } from '../types/FileEntry';
import { PaneId } from '../types/PaneGroup';
import { makeFileAndEditor } from './test-fixtures';
import { runGetAtomHook, runHookWithJotaiProvider, runSetAtomHook } from './test-utils';

vi.mock('../../io/filesystem');

describe('paneActions', () => {
  let store: ReturnType<typeof createStore>;
  let fileEntry: FileFileEntry;
  let editorData: EditorData;
  let fileContentAtoms: EditorContentAtoms;

  beforeEach(() => {
    const file = makeFileAndEditor('file.refstudio');
    fileEntry = file.fileEntry;
    editorData = file.editorData;

    vi.mocked(readFileContent).mockResolvedValue({ type: 'refstudio', jsonContent: { doc: 'File content' } });

    store = createStore();
    store.set(openFileEntryAtom, fileEntry);

    const activeEditorContentAtoms = runHookWithJotaiProvider(useActiveEditorContentAtoms, store).current;
    expect(activeEditorContentAtoms).not.toBeNull();

    fileContentAtoms = activeEditorContentAtoms!;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should focus panel to make active', () => {
    const activePane = runGetAtomHook(activePaneAtom, store);
    const focusPanel = runSetAtomHook(focusPaneAtom, store);

    const paneToFocus: PaneId = activePane.current.id === 'LEFT' ? 'RIGHT' : 'LEFT';

    act(() => {
      focusPanel.current(paneToFocus);
    });

    expect(activePane.current.id).toBe(paneToFocus);
  });

  it('should focus another pane when the last file is closed', () => {
    const openFileEntry = runSetAtomHook(openFileEntryAtom, store);
    const moveEditorToPane = runSetAtomHook(moveEditorToPaneAtom, store);
    const activePane = runGetAtomHook(activePaneAtom, store);
    const closeEditorFromPane = runSetAtomHook(closeEditorFromPaneAtom, store);

    const initialPaneId = activePane.current.id;
    const otherPaneId: PaneId = initialPaneId === 'LEFT' ? 'RIGHT' : 'LEFT';

    const { fileEntry: fileEntry2, editorData: editorData2 } = makeFileAndEditor('File2.refstudio');

    act(() => {
      openFileEntry.current(fileEntry2);
      moveEditorToPane.current({ editorId: editorData2.id, fromPaneId: initialPaneId, toPaneId: otherPaneId });
    });

    expect(activePane.current.id).toBe(otherPaneId);

    act(() => {
      closeEditorFromPane.current({ editorId: editorData2.id, paneId: otherPaneId });
    });

    expect(activePane.current.id).toBe(initialPaneId);
  });

  it('should not focus another pane when the last file of a pane is closed but no other pane contains files', () => {
    const activePane = runGetAtomHook(activePaneAtom, store);
    const closeEditorFromPane = runSetAtomHook(closeEditorFromPaneAtom, store);

    const initialPaneId = activePane.current.id;

    act(() => {
      closeEditorFromPane.current({ editorId: editorData.id, paneId: initialPaneId });
    });

    expect(activePane.current.id).toBe(initialPaneId);
  });

  it('should return the content of the active pane', () => {
    const activePane = runGetAtomHook(activePaneAtom, store);
    const focusPanel = runSetAtomHook(focusPaneAtom, store);

    const paneToFocus: PaneId = activePane.current.id === 'LEFT' ? 'RIGHT' : 'LEFT';

    act(() => {
      focusPanel.current(paneToFocus);
    });

    expect(activePane.current.id).toBe(paneToFocus);
  });

  it('should not update the file atom when using updateFileBufferAtom', async () => {
    const { loadableEditorContentAtom: loadableFileAtom, updateEditorContentBufferAtom: updateFileBufferAtom } =
      fileContentAtoms;

    const loadableFile = runGetAtomHook(loadableFileAtom, store);
    const updateFileBuffer = runSetAtomHook(updateFileBufferAtom, store);

    await waitFor(() => {
      expect(loadableFile.current.state).toBe('hasData');
    });

    const initialFileContent = { ...loadableFile.current };

    act(() => {
      updateFileBuffer.current({ type: 'refstudio', jsonContent: { doc: 'Updated content}' } });
    });

    expect(loadableFile.current).toStrictEqual(initialFileContent);
  });

  it('should update the file atom when using saveFileInMemoryAtom', async () => {
    const {
      loadableEditorContentAtom: loadableFileAtom,
      updateEditorContentBufferAtom: updateFileBufferAtom,
      saveEditorContentInMemoryAtom: saveFileInMemoryAtom,
    } = fileContentAtoms;

    const loadableFile = runGetAtomHook(loadableFileAtom, store);
    const updateFileBuffer = runSetAtomHook(updateFileBufferAtom, store);
    const saveFileInMemory = runSetAtomHook(saveFileInMemoryAtom, store);

    await waitFor(() => {
      expect(loadableFile.current.state).toBe('hasData');
    });

    const updatedContent = { doc: 'Updated content' };

    act(() => {
      updateFileBuffer.current({ type: 'refstudio', jsonContent: updatedContent });
      saveFileInMemory.current();
    });

    const expectedData: Loadable<EditorContent> = {
      state: 'hasData',
      data: { type: 'refstudio', jsonContent: updatedContent },
    };

    expect(loadableFile.current).toStrictEqual(expectedData);
  });

  it('should call writeFileContent when using saveFileAtom', async () => {
    vi.mocked(writeFileContent).mockResolvedValueOnce(true);
    vi.mocked(readAllProjectFiles).mockResolvedValueOnce([]);

    const {
      loadableEditorContentAtom: loadableFileAtom,
      updateEditorContentBufferAtom: updateFileBufferAtom,
      saveEditorContentAtom: saveFileAtom,
    } = fileContentAtoms;

    const loadableFile = runGetAtomHook(loadableFileAtom, store);
    const updateFileBuffer = runSetAtomHook(updateFileBufferAtom, store);
    const saveFile = runSetAtomHook(saveFileAtom, store);

    await waitFor(() => {
      expect(loadableFile.current.state).toBe('hasData');
    });

    await act(async () => {
      updateFileBuffer.current({ type: 'refstudio', jsonContent: { doc: 'Updated content' } });
      await saveFile.current();
    });

    expect(writeFileContent).toHaveBeenCalledOnce();
    expect(readAllProjectFiles).toHaveBeenCalledOnce();
  });

  it('should not call writeFileContent if the file buffer is empty', async () => {
    vi.mocked(writeFileContent).mockResolvedValueOnce(true);

    const { loadableEditorContentAtom: loadableFileAtom, saveEditorContentAtom: saveFileAtom } = fileContentAtoms;

    const loadableFile = runGetAtomHook(loadableFileAtom, store);
    const saveFile = runSetAtomHook(saveFileAtom, store);

    await waitFor(() => {
      expect(loadableFile.current.state).toBe('hasData');
    });

    await act(async () => {
      await saveFile.current();
    });

    expect(writeFileContent).not.toHaveBeenCalledOnce();
  });

  it('should not call writeFileContent if the type is not supported', async () => {
    vi.mocked(writeFileContent).mockResolvedValueOnce(true);

    const {
      loadableEditorContentAtom: loadableFileAtom,
      updateEditorContentBufferAtom: updateFileBufferAtom,
      saveEditorContentAtom: saveFileAtom,
    } = fileContentAtoms;

    const loadableFile = runGetAtomHook(loadableFileAtom, store);
    const updateFileBuffer = runSetAtomHook(updateFileBufferAtom, store);
    const saveFile = runSetAtomHook(saveFileAtom, store);

    await waitFor(() => {
      expect(loadableFile.current.state).toBe('hasData');
    });

    await act(async () => {
      updateFileBuffer.current({ type: 'json', textContent: 'Updated content' });
      await saveFile.current();
    });

    expect(writeFileContent).not.toHaveBeenCalledOnce();
  });

  it('should return the active editor', () => {
    const activeEditorId = runHookWithJotaiProvider(useActiveEditorId, store).current;
    const activeEditorContentAtoms = runHookWithJotaiProvider(useActiveEditorContentAtoms, store).current;

    expect(activeEditorId).not.toBeNull();
    expect(activeEditorId).toBe(buildEditorId('refstudio', fileEntry.path));
    expect(activeEditorContentAtoms).not.toBeNull();
    expect(activeEditorContentAtoms).toBe(fileContentAtoms);
  });

  it('should return the active editor id', () => {
    const activeEditorId = runHookWithJotaiProvider(useActiveEditorId, store).current;

    expect(activeEditorId).not.toBeNull();
    expect(activeEditorId).toBe(buildEditorId('refstudio', fileEntry.path));
  });
});
