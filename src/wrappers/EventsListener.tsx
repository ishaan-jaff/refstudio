import { atom, useAtomValue, useSetAtom } from 'jotai';

import {
  useFileProjectCloseListener,
  useFileProjectNewListener,
  useFileProjectNewSampleListener,
  useFileProjectOpenListener,
  useOpenProjectListener,
} from '../application/listeners/projectEventListeners';
import {
  activePaneAtom,
  closeAllEditorsAtom,
  closeEditorFromAllPanesAtom,
  closeEditorFromPaneAtom,
  moveEditorToPaneAtom,
} from '../atoms/editorActions';
import { createFileAtom, deleteFileAtom, openFilePathAtom, renameFileAtom } from '../atoms/fileEntryActions';
import { fileExplorerEntryPathBeingRenamed } from '../atoms/fileExplorerActions';
import { useActiveEditorContentAtoms } from '../atoms/hooks/useActiveEditorContentAtoms';
import { projectIdAtom } from '../atoms/projectState';
import { getReferencesAtom, removeReferencesAtom } from '../atoms/referencesState';
import { buildEditorIdFromPath } from '../atoms/types/EditorData';
import { PaneEditorId } from '../atoms/types/PaneGroup';
import { emitEvent, RefStudioEventPayload } from '../events';
import { useListenEvent } from '../hooks/useListenEvent';
import { exportReferences } from '../io/filesystem';
import { asyncNoop, noop } from '../lib/noop';
import {
  useClearNotificationsListener,
  useCreateNotificationListener,
  useHideNotificationsPopupListener,
  useShowNotificationsPopupListener,
  useTauriViewNotificationMenuListener,
} from '../notifications/eventListeners';

export function EventsListener({ children }: { children?: React.ReactNode }) {
  // Menu > File
  useListenEvent('refstudio://menu/file/new', useCreateFileListener());
  useListenEvent('refstudio://menu/file/save', useSaveActiveFileListener());
  useListenEvent('refstudio://menu/file/close', useCloseActiveEditorListener());
  useListenEvent('refstudio://menu/file/close/all', useCloseAllActiveEditorsListener());
  useListenEvent('refstudio://menu/file/project/new', useFileProjectNewListener());
  useListenEvent('refstudio://menu/file/project/new/sample', useFileProjectNewSampleListener());
  useListenEvent('refstudio://menu/file/project/open', useFileProjectOpenListener());
  useListenEvent('refstudio://menu/file/project/close', useFileProjectCloseListener());
  // Editors
  useListenEvent('refstudio://editors/close', useCloseEditorListener());
  useListenEvent('refstudio://editors/move', useMoveActiveEditorToPaneListener());
  // Explorer
  useListenEvent('refstudio://explorer/delete', useDeleteFileListener());
  useListenEvent('refstudio://explorer/open', useOpenFileListener());
  useListenEvent('refstudio://explorer/rename', useRenameFileListener());
  // References
  useListenEvent('refstudio://references/remove', useRemoveReferencesListener());
  useListenEvent('refstudio://menu/references/export', useExportReferencesListener());
  // Projects
  useListenEvent('refstudio://projects/open', useOpenProjectListener());
  // Notifications
  useListenEvent('refstudio://notifications/new', useCreateNotificationListener());
  useListenEvent('refstudio://notifications/clear', useClearNotificationsListener());
  // notifications popup
  useListenEvent('refstudio://notifications/popup/open', useShowNotificationsPopupListener());
  useListenEvent('refstudio://notifications/popup/close', useHideNotificationsPopupListener());
  // View
  useListenEvent('refstudio://menu/view/notifications', useTauriViewNotificationMenuListener());
  // Debug
  useListenEvent('refstudio://menu/debug/console/clear', useClearConsoleListener());

  return <>{children}</>;
}

function useSaveActiveFileListener() {
  const activeEditor = useActiveEditorContentAtoms();
  const saveFile = useSetAtom(activeEditor?.saveEditorContentAtom ?? atom(null, asyncNoop));

  return saveFile;
}

function useCreateFileListener() {
  const createFile = useSetAtom(createFileAtom);

  return createFile;
}

function useCloseActiveEditorListener() {
  const activePane = useAtomValue(activePaneAtom);

  if (!activePane.activeEditorId) {
    return noop;
  }

  const editorId = activePane.activeEditorId;
  const paneId = activePane.id;

  return () => emitEvent('refstudio://editors/close', { editorId, paneId });
}

function useCloseAllActiveEditorsListener() {
  const closeAllEditors = useSetAtom(closeAllEditorsAtom);

  return () => closeAllEditors();
}

function useCloseEditorListener() {
  const closeEditorFromPane = useSetAtom(closeEditorFromPaneAtom);

  return (paneEditorId: PaneEditorId) => closeEditorFromPane(paneEditorId);
}

function useRemoveReferencesListener() {
  const removeReferences = useSetAtom(removeReferencesAtom);
  const projectId = useAtomValue(projectIdAtom);
  return ({ referenceIds }: { referenceIds: string[] }) => void removeReferences(referenceIds, projectId);
}

function useExportReferencesListener() {
  const references = useAtomValue(getReferencesAtom);
  const closeEditorFromAllPanes = useSetAtom(closeEditorFromAllPanesAtom);
  const openFilePath = useSetAtom(openFilePathAtom);
  return async () => {
    const exportedFilePath = await exportReferences(references);
    if (exportedFilePath) {
      const editorId = buildEditorIdFromPath(exportedFilePath);
      closeEditorFromAllPanes(editorId);
      openFilePath(exportedFilePath);
    }
  };
}

function useDeleteFileListener() {
  const deleteFile = useSetAtom(deleteFileAtom);

  return ({ path }: RefStudioEventPayload<'refstudio://explorer/delete'>) => void deleteFile(path);
}

function useOpenFileListener() {
  const open = useSetAtom(openFilePathAtom);

  return ({ path }: RefStudioEventPayload<'refstudio://explorer/open'>) => open(path);
}

function useRenameFileListener() {
  const markFilePathAsBeingRenamed = useSetAtom(fileExplorerEntryPathBeingRenamed);
  const renameFile = useSetAtom(renameFileAtom);

  return ({ path, newName }: RefStudioEventPayload<'refstudio://explorer/rename'>) => {
    if (!newName) {
      markFilePathAsBeingRenamed(path);
    } else {
      void renameFile({ filePath: path, newName });
    }
  };
}

function useMoveActiveEditorToPaneListener() {
  const moveEditorToPane = useSetAtom(moveEditorToPaneAtom);

  // Note: Payload for .../left and .../right is the same
  return ({ fromPaneEditorId: editor, toPaneId }: RefStudioEventPayload<'refstudio://editors/move'>) => {
    moveEditorToPane({ editorId: editor.editorId, fromPaneId: editor.paneId, toPaneId });
  };
}

function useClearConsoleListener() {
  return () => {
    console.clear();
  };
}
