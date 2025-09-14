
import React, { useEffect, useMemo, useState } from 'react';
import { Page } from 'azure-devops-ui/Page';
import { TextField } from 'azure-devops-ui/TextField';
import { MessageCard, MessageCardSeverity } from 'azure-devops-ui/MessageCard';
import { fetchLabelItemsAll } from '../services/tfvcService';
import '../styles/hub.css';
import { Tree } from 'azure-devops-ui/TreeEx';
import { TfvcItem, TfvcLabelRef } from 'azure-devops-extension-api/Tfvc';
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Card } from 'azure-devops-ui/Card';


export function LabelDetails({ label, onBack }: { label: TfvcLabelRef; onBack: () => void }) {
  const [description, setDescription] = useState(label.description || '');
  const [items, setItems] = useState<TfvcItem[] | null>(null);
  const [selected, setSelected] = useState<string>('$/');
  const [expanded, setExpanded] = useState<string[]>(['$/']);

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

  // Convert TreeNode to ITreeItem[] recursively
  // const treeItems = useMemo(() => {
  //   if (!items) return [];
  //   const tree = buildTree(items);
  //   function toTreeItem(node: TreeNode): ITreeItem {
  //     return {
  //       id: node.path,
  //       text: node.name,
  //       isFolder: node.isFolder,
  //       children: node.children ? Array.from(node.children.values()).map(toTreeItem) : [],
  //       iconProps: { iconName: node.isFolder ? 'FabricFolderFill' : 'FileCode' },
  //     };
  //   }
  //   return [toTreeItem(tree)];
  // }, [items]);

  // Find children for selected folder
  const childrenInSelected = useMemo(() => {
    if (!items) return [] as TfvcItem[];
    const normalized = selected.endsWith('/') ? selected : selected + '/';
    const direct = items.filter(i => {
      const p = (i.path || '').replace(/^\$\/?/, '$/');
      if (!p.startsWith(normalized)) return false;
      const rest = p.substring(normalized.length);
      return rest.length > 0 && !rest.includes('/') && !rest.includes('\\');
    });
    return direct.sort((a, b) => Number(b.isFolder) - Number(a.isFolder) || (a.path || '').localeCompare(b.path || ''));
  }, [items, selected]);

  // Tree selection/expansion handlers
  // const onSelect = (event: React.MouseEvent<HTMLElement>, item: ITreeItem) => {
  //   setSelected(item.id);
  // };
  // const onExpandCollapse = (item: ITreeItem, expanded: boolean) => {
  //   setExpanded(prev => {
  //     if (expanded) return Array.from(new Set([...prev, item.id]));
  //     return prev.filter(id => id !== item.id);
  //   });
  // };

  return (
    <>
      {/* <div className="descBlock">
        <TextField value={description} onChange={(_e, v) => setDescription((v as string) || '')} multiline />
      </div>

      <div className="detailsSplit">
        <div className="treePane">
          <h4>Label folders</h4>
          {!items && <MessageCard severity={MessageCardSeverity.Info}>Loading label items…</MessageCard>}
          {items && (
            <Tree
              items={treeItems}
              selectionMode={TreeSelectionMode.Single}
              expandCollapseMode={TreeExpandCollapseMode.Multiple}
              selectedItemIds={[selected]}
              expandedItemIds={expanded}
              onSelect={onSelect}
              onExpandCollapse={onExpandCollapse}
              getItemHasChildren={(item: ITreeItem) => !!item.children && item.children.length > 0}
              getItemIsFolder={(item: ITreeItem) => !!item.isFolder}
              getItemText={(item: ITreeItem) => item.text}
              getItemIconProps={(item: ITreeItem) => item.iconProps}
            />
          )}
        </div>
        <div className="contentPane">
          <h4>Folder contents: {selected}</h4>
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
      </div> */}
    </>
  );
}
