import './NotionBlock.css';

import { Node } from '@tiptap/pm/model';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';

import { cx } from '../../../../../lib/cx';

interface NotionBlockProps {
  node: Node;
}

export function NotionBlock({ node }: NotionBlockProps) {
  return (
    <NodeViewWrapper>
      <div
        className={cx('notion-block', {
          collapsed: node.attrs.type === 'collapsible' && !!node.attrs.collapsed,
          'list-item':
            node.attrs.type === 'collapsible' ||
            node.attrs.type === 'unorderedList' ||
            node.attrs.type === 'orderedList',
        })}
      >
        <div className="drag-handle" contentEditable="false" data-drag-handle />
        <NodeViewContent className="content" />
      </div>
    </NodeViewWrapper>
  );
}
