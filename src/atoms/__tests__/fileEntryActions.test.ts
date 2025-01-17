import { createStore } from 'jotai';

import {
  deleteFile as deleteFileFromDisk,
  readAllProjectFiles,
  readFileContent,
  renameFile as renameFileFromDisk,
  writeFileContent,
} from '../../io/filesystem';
import { act } from '../../test/test-utils';
import { activePaneAtom } from '../editorActions';
import { createFileAtom, deleteFileAtom, openFileEntryAtom, renameFileAtom } from '../fileEntryActions';
import { refreshFileTreeAtom } from '../fileExplorerActions';
import { useActiveEditorContentAtomsForPane } from '../hooks/useActiveEditorContentAtomsForPane';
import { useActiveEditorIdForPane } from '../hooks/useActiveEditorIdForPane';
import { useOpenEditorsDataForPane } from '../hooks/useOpenEditorsDataForPane';
import { EditorContent } from '../types/EditorContent';
import { buildEditorId } from '../types/EditorData';
import { makeFile, makeFileAndEditor, makeFolder } from './test-fixtures';
import { runGetAtomHook, runHookWithJotaiProvider, runSetAtomHook } from './test-utils';

vi.mock('../../io/filesystem');

describe('fileEntryActions', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a file and open it in the LEFT pane', () => {
    const createFile = runSetAtomHook(createFileAtom, store);

    act(() => createFile.current());

    const leftPaneActiveEditorId = runHookWithJotaiProvider(() => useActiveEditorIdForPane('LEFT'), store).current;
    expect(leftPaneActiveEditorId).not.toBeNull();
    expect(leftPaneActiveEditorId).toMatchInlineSnapshot('"refstudio://refstudio/Untitled-1.refstudio"');
  });

  it('should create a file with the first available name', async () => {
    const createFile = runSetAtomHook(createFileAtom, store);
    vi.mocked(readAllProjectFiles).mockResolvedValueOnce([makeFile('Untitled-1.refstudio')]);
    await store.set(refreshFileTreeAtom);

    act(() => {
      createFile.current();
      createFile.current();
    });

    const leftPaneActiveEditorId = runHookWithJotaiProvider(() => useActiveEditorIdForPane('LEFT'), store).current;
    expect(leftPaneActiveEditorId).not.toBeNull();
    expect(leftPaneActiveEditorId).toMatchInlineSnapshot('"refstudio://refstudio/Untitled-3.refstudio"');
  });

  it('should delete the file', async () => {
    const fileEntry = makeFile('File 1.refstudio');
    vi.mocked(readAllProjectFiles).mockResolvedValueOnce([fileEntry]);
    await store.set(refreshFileTreeAtom);

    const deleteFile = runSetAtomHook(deleteFileAtom, store);
    await act(async () => {
      await deleteFile.current(fileEntry.path);
    });

    expect(deleteFileFromDisk).toHaveBeenCalledTimes(1);
    expect(deleteFileFromDisk).toHaveBeenCalledWith(fileEntry.path);
  });

  it('should close any open editor corresponding to the deleted file', async () => {
    const { fileEntry, editorData } = makeFileAndEditor('File 1.refstudio');
    vi.mocked(readAllProjectFiles).mockResolvedValue([fileEntry]);
    await store.set(refreshFileTreeAtom);
    store.set(openFileEntryAtom, fileEntry);

    const activePane = runGetAtomHook(activePaneAtom, store);

    expect(activePane.current.openEditorIds).toContain(editorData.id);

    vi.mocked(deleteFileFromDisk).mockResolvedValueOnce(true);

    const deleteFile = runSetAtomHook(deleteFileAtom, store);
    await act(async () => {
      await deleteFile.current(fileEntry.path);
    });

    expect(activePane.current.openEditorIds).not.toContain(editorData.id);
  });

  it('should throw an error when trying to delete a file that does not exist', async () => {
    const deleteFile = runSetAtomHook(deleteFileAtom, store);
    await expect(() => deleteFile.current('./fakePath/fakeFile')).rejects.toThrowError(/does not exist/);
  });

  it('should throw an error when trying to delete a folder', async () => {
    const folderEntry = makeFolder('Folder');
    vi.mocked(readAllProjectFiles).mockResolvedValueOnce([folderEntry]);
    await store.set(refreshFileTreeAtom);

    const deleteFile = runSetAtomHook(deleteFileAtom, store);
    await expect(() => deleteFile.current(folderEntry.path)).rejects.toThrowError(/Deleting folders is not supported/);
  });

  it('should rename the file', async () => {
    const fileEntry = makeFile('File.refstudio');
    vi.mocked(readAllProjectFiles).mockResolvedValue([fileEntry]);
    await store.set(refreshFileTreeAtom);

    vi.mocked(renameFileFromDisk).mockResolvedValueOnce({ success: true, newPath: '' });

    const newName = 'Updated File.refstudio';

    const renameFile = runSetAtomHook(renameFileAtom, store);
    await act(async () => {
      await renameFile.current({ filePath: fileEntry.path, newName });
    });

    expect(renameFileFromDisk).toHaveBeenCalledTimes(1);
    expect(renameFileFromDisk).toHaveBeenCalledWith(fileEntry.path, newName);
  });

  it('should update editor data when renaming file', async () => {
    const fileEntry = makeFile('File.refstudio');
    vi.mocked(readAllProjectFiles).mockResolvedValue([fileEntry]);
    await store.set(refreshFileTreeAtom);

    store.set(openFileEntryAtom, fileEntry);

    const leftPaneOpenEditorsData = runHookWithJotaiProvider(() => useOpenEditorsDataForPane('LEFT'), store);
    expect(leftPaneOpenEditorsData.current).toHaveLength(1);
    expect(leftPaneOpenEditorsData.current[0].id).toBe(buildEditorId('refstudio', fileEntry.path));
    expect(leftPaneOpenEditorsData.current[0].title).toBe(fileEntry.name);
    expect(leftPaneOpenEditorsData.current[0].isDirty).toBeFalsy();

    const newName = 'Updated File.refstudio';
    const newPath = '/new/path/to/file.refstudio';
    vi.mocked(renameFileFromDisk).mockResolvedValueOnce({ success: true, newPath });

    const renameFile = runSetAtomHook(renameFileAtom, store);
    await act(async () => {
      await renameFile.current({ filePath: fileEntry.path, newName });
    });

    expect(leftPaneOpenEditorsData.current).toHaveLength(1);
    expect(leftPaneOpenEditorsData.current[0].id).toBe(buildEditorId('refstudio', newPath));
    expect(leftPaneOpenEditorsData.current[0].title).toBe(newName);
  });

  it('should update editor content when renaming file', async () => {
    const fileEntry = makeFile('File.refstudio');
    vi.mocked(readAllProjectFiles).mockResolvedValue([fileEntry]);
    await store.set(refreshFileTreeAtom);

    const jsonContent = { doc: '' };
    const editorContent: EditorContent = { type: 'refstudio', jsonContent };
    vi.mocked(readFileContent).mockResolvedValue(editorContent);

    store.set(openFileEntryAtom, fileEntry);

    const leftPaneActiveEditorId = runHookWithJotaiProvider(() => useActiveEditorIdForPane('LEFT'), store);
    expect(leftPaneActiveEditorId.current).not.toBeNull();
    expect(leftPaneActiveEditorId.current).toBe(buildEditorId('refstudio', fileEntry.path));

    const leftPaneActiveEditorContentAtoms = runHookWithJotaiProvider(
      () => useActiveEditorContentAtomsForPane('LEFT'),
      store,
    ).current!;
    const editorId = store.get(leftPaneActiveEditorContentAtoms.editorIdAtom);
    expect(editorId).toBe(buildEditorId('refstudio', fileEntry.path));
    await act(async () => {
      store.set(leftPaneActiveEditorContentAtoms.updateEditorContentBufferAtom, editorContent);
      await store.set(leftPaneActiveEditorContentAtoms.saveEditorContentAtom);
    });
    expect(writeFileContent).toHaveBeenCalledTimes(1);
    expect(writeFileContent).toHaveBeenCalledWith(fileEntry.path, JSON.stringify(jsonContent));

    vi.mocked(writeFileContent).mockClear();

    const newName = 'Updated File.refstudio';
    const newPath = '/new/path/to/file.refstudio';
    vi.mocked(renameFileFromDisk).mockResolvedValueOnce({ success: true, newPath });

    const renameFile = runSetAtomHook(renameFileAtom, store);
    await act(async () => {
      await renameFile.current({ filePath: fileEntry.path, newName });
    });

    expect(leftPaneActiveEditorId.current).not.toBeNull();
    expect(leftPaneActiveEditorId.current).toBe(buildEditorId('refstudio', newPath));
    const newEditorId = store.get(leftPaneActiveEditorContentAtoms.editorIdAtom);
    expect(newEditorId).toBe(buildEditorId('refstudio', newPath));
    await act(async () => {
      store.set(leftPaneActiveEditorContentAtoms.updateEditorContentBufferAtom, editorContent);
      await store.set(leftPaneActiveEditorContentAtoms.saveEditorContentAtom);
    });
    expect(writeFileContent).toHaveBeenCalledTimes(1);
    expect(writeFileContent).toHaveBeenCalledWith(newPath, JSON.stringify(jsonContent));
  });

  it('should throw an error when trying to rename a file that does not exist', async () => {
    const renameFile = runSetAtomHook(renameFileAtom, store);
    await expect(() => renameFile.current({ filePath: './fakePath/fakeFile', newName: '' })).rejects.toThrowError(
      /does not exist/,
    );
  });

  it('should throw an error when trying to rename a folder', async () => {
    const folderEntry = makeFolder('Folder');
    vi.mocked(readAllProjectFiles).mockResolvedValueOnce([folderEntry]);
    await store.set(refreshFileTreeAtom);

    const renameFile = runSetAtomHook(renameFileAtom, store);
    await expect(() => renameFile.current({ filePath: folderEntry.path, newName: '' })).rejects.toThrowError(
      /Renaming folders is not supported/,
    );
  });

  it('should do nothing if renaming fails', async () => {
    const fileEntry = makeFile('File.refstudio');
    vi.mocked(readAllProjectFiles).mockResolvedValue([fileEntry]);
    await store.set(refreshFileTreeAtom);

    store.set(openFileEntryAtom, fileEntry);

    vi.mocked(renameFileFromDisk).mockResolvedValueOnce({ success: false });

    const newName = 'Updated File.refstudio';

    const leftPaneOpenEditorsData = runHookWithJotaiProvider(() => useOpenEditorsDataForPane('LEFT'), store);
    const leftPaneActiveEditorId = runHookWithJotaiProvider(() => useActiveEditorIdForPane('LEFT'), store);

    expect(leftPaneOpenEditorsData.current).toHaveLength(1);
    expect(leftPaneOpenEditorsData.current[0].id).toBe(buildEditorId('refstudio', fileEntry.path));
    expect(leftPaneOpenEditorsData.current[0].title).toBe(fileEntry.name);

    expect(leftPaneActiveEditorId.current).not.toBeNull();
    expect(leftPaneActiveEditorId.current).toBe(buildEditorId('refstudio', fileEntry.path));

    const renameFile = runSetAtomHook(renameFileAtom, store);
    await act(async () => {
      await renameFile.current({ filePath: fileEntry.path, newName });
    });

    expect(leftPaneOpenEditorsData.current).toHaveLength(1);
    expect(leftPaneOpenEditorsData.current[0].id).toBe(buildEditorId('refstudio', fileEntry.path));
    expect(leftPaneOpenEditorsData.current[0].title).toBe(fileEntry.name);

    expect(leftPaneActiveEditorId.current).not.toBeNull();
    expect(leftPaneActiveEditorId.current).toBe(buildEditorId('refstudio', fileEntry.path));
  });
});
