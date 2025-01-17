import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';

import {
  fileExplorerAtom,
  fileExplorerEntryPathBeingRenamed,
  refreshFileTreeAtom,
} from '../../atoms/fileExplorerActions';
import { useActiveEditorIdForPane } from '../../atoms/hooks/useActiveEditorIdForPane';
import { parseEditorId } from '../../atoms/types/EditorData';
import { FileExplorerFileEntry, FileExplorerFolderEntry } from '../../atoms/types/FileExplorerEntry';
import { FileNameInput } from '../../components/FileNameInput';
import { emitEvent } from '../../events';
import { useAsyncEffect } from '../../hooks/useAsyncEffect';
import { cx } from '../../lib/cx';
import { isNonNullish } from '../../lib/isNonNullish';
import { FILE_EXPLORER_FILE_MENU_ID } from './fileExplorerContextMenu/FileExplorerFileContextMenu';
import { useFileExplorerContextMenu } from './fileExplorerContextMenu/useFileExplorerContextMenu';
import { ArrowRightIcon } from './icons';

export function FileExplorer() {
  const rootFileExplorerEntry = useAtomValue(fileExplorerAtom);
  const projectFileEntries = useAtomValue(rootFileExplorerEntry.childrenAtom);

  const refreshFileTree = useSetAtom(refreshFileTreeAtom);

  useAsyncEffect(refreshFileTree);

  return (
    <>
      {projectFileEntries.map((fileEntry) =>
        fileEntry.isFolder ? (
          <FolderNode folder={fileEntry} key={fileEntry.path} />
        ) : (
          <FileNode
            existingFileNames={projectFileEntries.map((file) => file.name)}
            file={fileEntry}
            key={fileEntry.path}
          />
        ),
      )}
    </>
  );
}

interface FolderNodeProps {
  folder: FileExplorerFolderEntry;
}
export function FolderNode({ folder }: FolderNodeProps) {
  const childrenEntries = useAtomValue(folder.childrenAtom);
  const [collapsed, setCollapsed] = useAtom(folder.collapsedAtom);

  return (
    <div className="flex flex-col items-start gap-2 self-stretch">
      <div
        className={cx('flex cursor-pointer select-none items-start gap-1 self-stretch')}
        onClick={() => setCollapsed((currentState) => !currentState)}
      >
        <div
          className={cx('text-btn-ico-side-bar-item transition duration-100 ease-in-out', { 'rotate-90': !collapsed })}
        >
          <ArrowRightIcon />
        </div>
        <h2 className="overflow-hidden overflow-ellipsis whitespace-nowrap">{folder.name}</h2>
      </div>
      {!collapsed && (
        <div className="flex flex-col items-start gap-2 self-stretch pl-5">
          {childrenEntries.map((child) =>
            child.isFolder ? (
              <FolderNode folder={child} key={child.path} />
            ) : (
              <FileNode existingFileNames={childrenEntries.map((file) => file.name)} file={child} key={child.path} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

interface FileNodeProps {
  file: FileExplorerFileEntry;
  existingFileNames: string[];
}
export function FileNode({ file, existingFileNames }: FileNodeProps) {
  const [pathBeingRenamed, setPathBeingRenamed] = useAtom(fileExplorerEntryPathBeingRenamed);

  const leftPaneActiveEditorId = useActiveEditorIdForPane('LEFT');
  const rightPaneActiveEditorId = useActiveEditorIdForPane('RIGHT');
  const isFileActive = useMemo(
    () =>
      [leftPaneActiveEditorId, rightPaneActiveEditorId]
        .filter(isNonNullish)
        .map((editorId) => parseEditorId(editorId).id)
        .includes(file.path),
    [leftPaneActiveEditorId, rightPaneActiveEditorId, file.path],
  );

  const show = useFileExplorerContextMenu(FILE_EXPLORER_FILE_MENU_ID, { id: file.path });

  const isNameValid = useCallback(
    (name: string) => {
      if (name.startsWith('.')) {
        return false;
      }
      if (name.includes('/')) {
        return false;
      }

      return !existingFileNames.includes(name);
    },
    [existingFileNames],
  );

  return pathBeingRenamed === file.path ? (
    <FileNameInput
      fileName={file.name}
      isNameValid={isNameValid}
      onCancel={() => setPathBeingRenamed(null)}
      onSubmit={(newName: string) => emitEvent('refstudio://explorer/rename', { path: file.path, newName })}
    />
  ) : (
    <div
      className={cx(
        'flex shrink-0 items-center gap-1 self-stretch px-2 py-1',
        'text-btn-txt-side-bar-item-primary',
        'rounded-default hover:bg-btn-bg-side-bar-item-hover',
        'cursor-pointer select-none',
        {
          'bg-btn-bg-side-bar-item-default': !isFileActive,
          'bg-btn-bg-side-bar-item-active': isFileActive,
        },
      )}
      onClick={() => emitEvent('refstudio://explorer/open', { path: file.path })}
      onContextMenu={show}
    >
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">{file.name}</div>
    </div>
  );
}
