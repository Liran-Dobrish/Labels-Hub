import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import * as SDK from 'azure-devops-extension-sdk';
import 'azure-devops-ui/Core/override.css';
import './styles/hub.css';
import './styles/global.css';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { Page } from 'azure-devops-ui/Page';
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { fetchAllLabels, fetchLabelsFirst } from './services/tfvcService';
import { LabelsList } from './components/LabelsList';
import { LabelDetails } from './components/LabelDetails';
import { ITableRow } from 'azure-devops-ui/Table';
import { Toast } from "azure-devops-ui/Toast";
import { TfvcLabelRef } from 'azure-devops-extension-api/Tfvc';
import { Card } from 'azure-devops-ui/Card';

export default function Hub() {
  const [allItems, setAllItems] = useState<TfvcLabelRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TfvcLabelRef | null>(null);
  const [loadedAll, setLoadedAll] = useState(false);
  const [SDKLoaded, setSDKLoaded] = useState(false);

  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isToastFadingOut, setIsToastFadingOut] = useState(false);

  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    SDK.init({ loaded: false }).then(async () => {
      try {
        console.log("Initializing SDK...");
        const first = await fetchLabelsFirst(100);
        setAllItems(first);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        SDK.notifyLoadSucceeded();
        console.log("SDK initialized.");
        await SDK.ready();
        setSDKLoaded(true);
        console.log("SDK ready.");
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (SDKLoaded) {
        try {
          console.log("Fetching all labels...");
          const full: TfvcLabelRef[] = await fetchAllLabels(500);
          setAllItems(full);
          setLoadedAll(true);
          console.log(`Loaded ${full.length} labels`);
          setIsToastVisible(true);
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [SDKLoaded]);

  useEffect(() => {
    if (SDKLoaded && isToastVisible) {
      console.log(`setting toast timer`);
      const timer = setTimeout(() => {
        if (toastRef.current) {
          setIsToastFadingOut(true);
          toastRef.current?.fadeOut().promise.then(() => {
            setIsToastVisible(false);
            setIsToastFadingOut(false);
          });
          console.log(`created timer ${timer}`);
        }
      }, 3000);

      return () => {
        clearTimeout(timer); // Cleanup if component unmounts or toast is hidden
        console.log(`timer cleared ${timer}`);
      };
    }
  }, [isToastVisible, SDKLoaded]);

  if (loading) return (<Page className="container"><Surface background={SurfaceBackground.neutral}><Spinner size={SpinnerSize.large} /></Surface></Page>);

  if (selected) {
    return (
      <Page className="flex-grow full-width">
        <Header
          title={selected.name}
          titleSize={TitleSize.Medium}
          backButtonProps={{ onClick: () => setSelected(null) }}
          titleAriaLevel={3}
        />

        <div className="page-content page-content-top">
          <Card>
            <LabelDetails label={selected} onBack={() => setSelected(null)} />
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page className="flex-grow full-width">
      <Header title="Labels"
        description={"A hub to browse TFVC labels in the current project."}
        titleSize={TitleSize.Large} />
      <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
        <LabelsList items={allItems} initialCount={Math.min(100, allItems.length)} onSelect={(event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<TfvcLabelRef>) => setSelected(tableRow.data)} onLoadedCount={() => { }} loadedAll={loadedAll} />
      </Card>
      {isToastVisible && <Toast
        ref={toastRef}
        message={`Loaded ${allItems.length} labels`}
        className='justify-center'
      />}
    </Page>
  );
}

ReactDOM.render(<Hub />, document.getElementById('root'));
