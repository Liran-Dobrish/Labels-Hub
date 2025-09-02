import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IListBoxItem } from 'azure-devops-ui/ListBox';
import { Page } from 'azure-devops-ui/Page';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { DropdownFilterBarItem } from 'azure-devops-ui/Dropdown';
import { Table, ITableColumn, SimpleTableCell, SortOrder, sortItems, ColumnSorting } from 'azure-devops-ui/Table';
import { ListSelection } from 'azure-devops-ui/List';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider';
import { TfvcLabelItem } from '../types/tfvc';
import { VssPersona } from "azure-devops-ui/VssPersona";
import '../styles/hub.css';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import { Toast } from "azure-devops-ui/Toast";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { Filter, FILTER_CHANGE_EVENT, FilterOperatorType } from "azure-devops-ui/Utilities/Filter";
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
  onSelect: (item: TfvcLabelItem) => void;
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
      const nameFilter = state.textSearch?.value;
      const ownerFilter = state.OwnerFilter?.value;
      console.log(`filter: ${JSON.stringify(state)}`);

      setFilteredItems(items.filter((item: TfvcLabelItem) =>
      (item.name.includes(nameFilter) &&
        item.owner.displayName.includes(ownerFilter))
      ));

    };

    filter.subscribe(subscription, FILTER_CHANGE_EVENT);

    return () => {
      filter.unsubscribe(subscription, FILTER_CHANGE_EVENT);
    };
  }, []);

  const ownerOptions: IListBoxItem[] = useMemo(() => {
    const map = new Map<string, { id: string; text: string }>();
    items.forEach(i => { if (i.owner?.id && !map.has(i.owner.id)) map.set(i.owner.id, { id: i.owner.id, text: i.owner.displayName || i.owner.uniqueName || i.owner.id }); });
    return Array.from(map.values());
  }, [items]);

  // Create the sorting behavior (delegate that is called when a column is sorted).
  const sortingBehavior = new ColumnSorting<TfvcLabelItem>(
    (
      columnIndex: number,
      proposedSortOrder: SortOrder,
      event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>
    ) => {
      filteredItems.splice(
        0,
        items.length,
        ...sortItems<TfvcLabelItem>(
          columnIndex,
          proposedSortOrder,
          sortFunctions,
          columns,
          items
        )
      );
    }
  );

  const sortFunctions = [
    null,
    null,
    // Sort on Name column
    (item1: TfvcLabelItem, item2: TfvcLabelItem): number => {
      return item1.modifiedDate.getTime() - item2.modifiedDate.getTime();
    },
  ];

  function onSize(event: MouseEvent | KeyboardEvent, index: number, width: number) {
    (columns[index].width as ObservableValue<number>).value = width;
  }

  const columns: ITableColumn<TfvcLabelItem>[] = [
    {
      id: 'name',
      name: 'Name',
      onSize: onSize,
      width: new ObservableValue(200),
      renderCell: (row, col, _c, item) => (<SimpleTableCell columnIndex={col} key={`name-${row}`}>{item?.name}</SimpleTableCell>)
    },
    {
      id: 'owner',
      name: 'Owner',
      onSize: onSize,
      width: new ObservableValue(280),
      renderCell: (row, col, _c, item) => (
        <SimpleTableCell columnIndex={col} key={`owner-${row}`}>
          <VssPersona identityDetailsProvider={{ getDisplayName: () => item.owner.displayName, getIdentityImageUrl: () => undefined }} size={"medium"} />{` ${item.owner.displayName}`}
        </SimpleTableCell>),
    },
    {
      id: 'modified',
      name: 'Modified',
      onSize: onSize,
      width: new ObservableValue(200),
      renderCell: (row, col, _c, item) => (<SimpleTableCell columnIndex={col} key={`mod-${row}`}>{item?.modifiedDate.toLocaleString()}</SimpleTableCell>),
      sortProps: {
        ariaLabelAscending: "Sorted low to high",
        ariaLabelDescending: "Sorted high to low",
      },
    },
  ];

  const selection = useMemo(() => new ListSelection({ selectOnFocus: false, multiSelect: false }), []);
  const itemProvider = useMemo(() => new ArrayItemProvider(filteredItems), [filterRef.current]);

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
              placeholder="Owner"
            />
          </FilterBar>
        </div>

        {!loadedAll && <Spinner size={SpinnerSize.large} />}

        <Table
          columns={columns}
          role="table"
          behaviors={[sortingBehavior]}
          itemProvider={itemProvider}
          selection={selection}
        />

        {showToast && <Toast
          ref={toastRef}
          message={`Loaded ${items.length} labels`}
        />}
      </Surface>
    </Page>
  );
}
