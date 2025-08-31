import React, { useEffect, useMemo, useState } from 'react';
import { IListBoxItem } from 'azure-devops-ui/ListBox';
import { Page } from 'azure-devops-ui/Page';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { TextField } from 'azure-devops-ui/TextField';
import { Dropdown } from 'azure-devops-ui/Dropdown';
import { Table, ITableColumn, SimpleTableCell } from 'azure-devops-ui/Table';
import { ListSelection } from 'azure-devops-ui/List';
import { Icon } from 'azure-devops-ui/Icon';
import { MessageCard, MessageCardSeverity } from 'azure-devops-ui/MessageCard';
import { Button } from 'azure-devops-ui/Button';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider';
import { orderBy } from 'lodash';
import { TfvcLabelItem } from '../types/tfvc';
import '../styles/hub.css';

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return <div className="toast">{message}</div>;
}

export function LabelsList({
  items,
  initialCount,
  onSelect,
  onLoadedCount,
  loadedAll,
}: {
  items: TfvcLabelItem[];
  initialCount: number;
  onSelect: (item: TfvcLabelItem) => void;
  onLoadedCount: (count: number) => void;
  loadedAll: boolean;
}) {
  const [filterName, setFilterName] = useState('');
  const [filterOwner, setFilterOwner] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'id' | 'modifiedDate'>('modifiedDate');
  const [sortDesc, setSortDesc] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadedCount, setLoadedCount] = useState(initialCount);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    onLoadedCount(loadedCount);
  }, [loadedCount, onLoadedCount]);

  useEffect(() => {
    if (items.length > loadedCount) setLoadedCount(items.length);
  }, [items.length]);

  useEffect(() => { if (loadedAll) setShowToast(true); }, [loadedAll]);

  const ownerOptions: IListBoxItem[] = useMemo(() => {
    const map = new Map<string, { id: string; text: string }>();
    items.forEach(i => { if (i.owner?.id && !map.has(i.owner.id)) map.set(i.owner.id, { id: i.owner.id, text: i.owner.displayName || i.owner.uniqueName || i.owner.id }); });
    return [{ id: 'any', text: 'Any owner' }, ...Array.from(map.values())];
  }, [items]);

  const sorted = useMemo(() => orderBy(items, [sortBy], [sortDesc ? 'desc' : 'asc']), [items, sortBy, sortDesc]);

  const [pendingFilters, setPendingFilters] = useState<{ name: string; owner?: string } | null>(null);
  useEffect(() => {
    if (pendingFilters && loadedAll) {
      setFilterName(pendingFilters.name);
      setFilterOwner(pendingFilters.owner);
      setIsFiltering(false);
      setPendingFilters(null);
    }
  }, [pendingFilters, loadedAll]);

  const requestFilter = (name: string, owner?: string) => {
    if (!loadedAll) { setIsFiltering(true); setPendingFilters({ name, owner }); }
    else { setFilterName(name); setFilterOwner(owner); }
  };

  const filtered = useMemo(() => {
    let v = sorted;
    if (filterName) v = v.filter((x: TfvcLabelItem) => x.name.toLowerCase().includes(filterName.toLowerCase()));
    if (filterOwner && filterOwner !== 'any') v = v.filter((x: TfvcLabelItem) => x.owner?.id === filterOwner);
    return v;
  }, [sorted, filterName, filterOwner]);

  const columns: ITableColumn<TfvcLabelItem>[] = [
    { id: 'id', name: 'ID', width: 80, renderCell: (row, col, _c, item) => (<SimpleTableCell columnIndex={col} key={`id-${row}`}>{item?.id}</SimpleTableCell>) },
    { id: 'name', name: 'Name', width: -40, renderCell: (row, col, _c, item) => (<SimpleTableCell columnIndex={col} key={`name-${row}`}>{item?.name}</SimpleTableCell>) },
    { id: 'owner', name: 'Owner', width: 280, renderCell: (row, col, _c, item) => (
      <SimpleTableCell columnIndex={col} key={`owner-${row}`}>
        <Icon iconName="Contact" /> {item?.owner?.displayName || item?.owner?.uniqueName || 'Unknown'}
      </SimpleTableCell>) },
    { id: 'modified', name: 'Modified', width: 200, renderCell: (row, col, _c, item) => (<SimpleTableCell columnIndex={col} key={`mod-${row}`}>{item?.modifiedDate.toLocaleString()}</SimpleTableCell>) },
  ];

  const selection = useMemo(() => new ListSelection({ selectOnFocus: false, multiSelect: false }), []);
  const visibleItems = filtered.slice(0, Math.max(loadedCount, 100));
  const itemProvider = useMemo(() => new ArrayItemProvider(visibleItems), [visibleItems]);

  return (
    <Page className="container">
      <Surface background={SurfaceBackground.neutral}>
        <div className="filtersBar">
          <TextField placeholder="Filter by name" value={pendingFilters?.name ?? filterName} onChange={(_e, v) => requestFilter((v as string) || '', pendingFilters?.owner ?? filterOwner)} />
          <Dropdown placeholder="Owner" items={ownerOptions} onSelect={(_e, item) => requestFilter(pendingFilters?.name ?? filterName, item && (item as IListBoxItem).id === 'any' ? undefined : String((item as IListBoxItem)?.id))} />
          <div className="sortBtns">
            <Button text={`Sort: ID ${sortBy==='id'?(sortDesc?'▼':'▲'):''}`} onClick={() => { setSortBy('id'); setSortDesc(s => !s); }} />
            <Button text={`Sort: Modified ${sortBy==='modifiedDate'?(sortDesc?'▼':'▲'):''}`} onClick={() => { setSortBy('modifiedDate'); setSortDesc(s => !s); }} />
          </div>
          {isFiltering && <MessageCard severity={MessageCardSeverity.Info}>Loading all items to apply filter… Loaded {items.length} items.</MessageCard>}
        </div>

        {!loadedAll && <Spinner size={SpinnerSize.large} />}

        <Table
          columns={columns}
          itemProvider={itemProvider}
          selection={selection}
          onActivate={(_event: any, data: any) => onSelect(visibleItems[data.rowIndex])}
        />

        {showToast && <Toast message={`Loaded ${items.length} labels`} onDismiss={() => setShowToast(false)} />}
      </Surface>
    </Page>
  );
}
