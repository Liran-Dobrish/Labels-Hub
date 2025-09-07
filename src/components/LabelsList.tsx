import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IListBoxItem } from 'azure-devops-ui/ListBox';
import { Page } from 'azure-devops-ui/Page';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { DropdownFilterBarItem } from 'azure-devops-ui/Dropdown';
import { IListItemDetails, ListItem, ListSelection, ScrollableList } from 'azure-devops-ui/List';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { Card } from 'azure-devops-ui/Card';
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider';
import { TfvcLabelItem } from '../types/tfvc';
import { VssPersona } from "azure-devops-ui/VssPersona";
import '../styles/hub.css';
import { Toast } from "azure-devops-ui/Toast";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { Filter, FILTER_CHANGE_EVENT } from "azure-devops-ui/Utilities/Filter";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";

export function LabelsList({
  items,
  initialCount,
  onSelect,
  onLoadedCount,
  loadedAll,
}: {
  
  items: TfvcLabelItem[];
  initialCount: number;
  onSelect: (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<TfvcLabelItem>) => void;
  onLoadedCount: (count: number) => void;
  loadedAll: boolean;
}) {
  const [filteredItems, setFilteredItems] = useState<TfvcLabelItem[]>(items);
  const [loadedCount, setLoadedCount] = useState(initialCount);
  const [showToast, setShowToast] = useState(false);
  const filterRef = useRef<Filter>(new Filter());
  const toastRef: React.RefObject<Toast> = React.createRef<Toast>();
  const ownerSelection = useRef(new DropdownSelection());

  useEffect(() => {
    onLoadedCount(loadedCount);
  }, [loadedCount, onLoadedCount]);

  useEffect(() => {
    if (items.length > loadedCount) setLoadedCount(items.length);
  }, [items.length]);

  useEffect(() => {
    if (loadedAll) {
      setShowToast(true);
      const toast = toastRef.current;
      if (!toast) return;
      const timer = window.setTimeout(() => {
        toast.fadeOut().promise.then(() => {
          setShowToast(false);
        });
      }, 3000);
      return () => window.clearTimeout(timer);
    }
  }, [loadedAll]);

  useEffect(() => {
    const filter = filterRef.current;

    const subscription = () => {
      // filter the items based on name and owner display name
      const state = filterRef.current.getState();
      const nameFilter = (state.textSearch?.value || "").toString().toLowerCase();
      const ownerFilter = (state.OwnerFilter?.value || "").toString().toLowerCase();

      setFilteredItems(
        items.filter((item: TfvcLabelItem) =>
          (item.name || "").toLowerCase().includes(nameFilter) &&
          (item.owner?.displayName || "").toLowerCase().includes(ownerFilter)
        )
      );

    };

    filter.subscribe(subscription, FILTER_CHANGE_EVENT);

    return () => {
      filter.unsubscribe(subscription, FILTER_CHANGE_EVENT);
    };
  }, []);

  const ownerOptions: IListBoxItem<TfvcLabelItem>[] = useMemo(() => {
    const map = new Map<string, { id: string; text: string }>();
    items.forEach(i => { if (i.owner?.id && !map.has(i.owner.id)) map.set(i.owner.id, { id: i.owner.id, text: i.owner.displayName || i.owner.uniqueName || i.owner.id }); });
    return Array.from(map.values());
  }, [items]);

  // Re-compute filtered items whenever items change to respect current filters
  useEffect(() => {
    const state = filterRef.current.getState();
    const nameFilter = (state.textSearch?.value || "").toString().toLowerCase();
    const ownerFilter = (state.OwnerFilter?.value || "").toString().toLowerCase();
    setFilteredItems(
      items.filter((item: TfvcLabelItem) =>
        (item.name || "").toLowerCase().includes(nameFilter) &&
        (item.owner?.displayName || "").toLowerCase().includes(ownerFilter)
      )
    );
  }, [items]);

  const selection = useMemo(() => new ListSelection({ selectOnFocus: false, multiSelect: false }), []);
  const itemProvider = useMemo(() => new ArrayItemProvider(filteredItems), [filteredItems]);

  const renderRow = (index: number, item: TfvcLabelItem, details: IListItemDetails<TfvcLabelItem>, key?: string) => {
    if (!item) return null;
    const ownerName = item.owner?.displayName || item.owner?.uniqueName || "";
    const dateText = item.modifiedDate ? item.modifiedDate.toLocaleString() : "";
    return (
      <ListItem key={key || "list-item" + index} index={index} details={details}
        className="bolt-list-row flex-row size-56">
        <div className="bolt-list-cell flex-column text-ellipsis" >
          <div className="text-ellipsis bolt-font-weight-semibold">{item.name}</div>
          <div className="text-ellipsis secondary-text flex-row flex-center row-meta">
            <span className="ml8">{item.id}</span>
            <VssPersona
              size="small"
              identityDetailsProvider={{
                getDisplayName: () => ownerName,
                getIdentityImageUrl: () => undefined,
              }}
            />
            <span className="ml8">{ownerName}</span>
            <span className="muted ml8">{dateText}</span>
          </div>
        </div>
      </ListItem>
    );
  };

  return (
    <Page className="container">
      <Surface background={SurfaceBackground.neutral}>
        <div className="flex-grow">
          <FilterBar filter={filterRef.current}>
            <KeywordFilterBarItem filterItemKey="textSearch" />
            <DropdownFilterBarItem
              filterItemKey="OwnerFilter"
              filter={filterRef.current}
              items={ownerOptions}
              selection={ownerSelection.current}
              onSelect={onSelect}
              placeholder="Owner"
            />
          </FilterBar>
        </div>

        {!loadedAll && <Spinner size={SpinnerSize.large} />}
        <Card className="flex-grow bolt-table-card">
          <ScrollableList
            itemProvider={itemProvider}
            selection={selection}
            renderRow={renderRow}
            width='100%'
          />
        </Card>
        {showToast && <Toast
          ref={toastRef}
          message={`Loaded ${items.length} labels`}
        />}
      </Surface>
    </Page>
  );
}
