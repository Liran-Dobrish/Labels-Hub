import React, { useEffect, useMemo, useState } from 'react';
import { Page } from 'azure-devops-ui/Page';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { TextField } from 'azure-devops-ui/TextField';
import { MessageCard, MessageCardSeverity } from 'azure-devops-ui/MessageCard';
import { Button } from 'azure-devops-ui/Button';
import { TfvcItemRef, TfvcLabelItem } from '../types/tfvc';
import { buildTree, fetchLabelItemsAll, TreeNode } from '../services/tfvcService';
import '../styles/hub.css';

function TreeView({ node, selectedPath, onSelect }: { node: TreeNode; selectedPath: string; onSelect: (p: string) => void }) {
  const entries = Array.from(node.children || new Map()).sort((a, b) => a[0].localeCompare(b[0]));
  return (
    <ul className="tree">
      {entries.map(([name, child]) => (
        <li key={child.path}>
          <button className={`treeItem ${selectedPath === child.path ? 'selected' : ''}`} onClick={() => onSelect(child.path)}>
            {child.isFolder ? '📁' : '📄'} {name}
          </button>
          {child.children && child.children.size > 0 && selectedPath.startsWith(child.path) && child.isFolder && (
            <TreeView node={child} selectedPath={selectedPath} onSelect={onSelect} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function LabelDetails({ label, onBack }: { label: TfvcLabelItem; onBack: () => void }) {
  const [description, setDescription] = useState(label.description || '');
  const [items, setItems] = useState<TfvcItemRef[] | null>(null);
  const [selectedPath, setSelectedPath] = useState('$/');

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const res = await fetchLabelItemsAll(String(label.id));
        if (!disposed) setItems(res);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { disposed = true; };
  }, [label.id]);

  const tree = useMemo(() => (items ? buildTree(items) : null), [items]);
  const childrenInSelected = useMemo(() => {
    if (!items) return [] as TfvcItemRef[];
    const normalized = selectedPath.endsWith('/') ? selectedPath : selectedPath + '/';
    const direct = items.filter(i => {
      const p = (i.path || '').replace(/^\$\/?/, '$/');
      if (!p.startsWith(normalized)) return false;
      const rest = p.substring(normalized.length);
      return rest.length > 0 && !rest.includes('/') && !rest.includes('\\');
    });
    return direct.sort((a, b) => Number(b.isFolder) - Number(a.isFolder) || (a.path || '').localeCompare(b.path || ''));
  }, [items, selectedPath]);

  return (
    <Page className="container">
      <Surface background={SurfaceBackground.neutral}>
        <div className="headerRow">
          <Button text="Back" onClick={onBack} />
          <h2 className="titleNoMargin">{label.name}</h2>
        </div>

        <div className="descBlock">
          <TextField value={description} onChange={(_e, v) => setDescription((v as string) || '')} multiline />
        </div>

        <div className="detailsSplit">
          <div className="treePane">
            <h4>Label folders</h4>
            {!tree && <MessageCard severity={MessageCardSeverity.Info}>Loading label items…</MessageCard>}
            {tree && <TreeView node={tree} selectedPath={selectedPath} onSelect={setSelectedPath} />}
          </div>
          <div className="contentPane">
            <h4>Folder contents: {selectedPath}</h4>
            {!items && <MessageCard severity={MessageCardSeverity.Info}>Loading…</MessageCard>}
            {items && (
              <ul className="contentList">
                {childrenInSelected.map(i => (
                  <li key={i.path} className="contentRow">
                    <span className="mono">{i.isFolder ? '📁' : '📄'}</span>
                    <span>{(i.path || '').split('/').pop()}</span>
                  </li>
                ))}
                {childrenInSelected.length === 0 && <li className="muted">(Empty)</li>}
              </ul>
            )}
          </div>
        </div>
      </Surface>
    </Page>
  );
}
