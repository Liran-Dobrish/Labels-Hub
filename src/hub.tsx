import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as SDK from 'azure-devops-extension-sdk';
import 'azure-devops-ui/Core/override.css';
import './styles/hub.css';
import './styles/global.css';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { Page } from 'azure-devops-ui/Page';
import { Surface, SurfaceBackground } from 'azure-devops-ui/Surface';
import { fetchAllLabels, fetchLabelsFirst } from './services/tfvcService';
import { TfvcLabelItem } from './types/tfvc';
import { LabelsList } from './components/LabelsList';
import { LabelDetails } from './components/LabelDetails';

export default function Hub() {
  const [all, setAll] = useState<TfvcLabelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TfvcLabelItem | null>(null);
  const [loadedAll, setLoadedAll] = useState(false);

  useEffect(() => {
    SDK.init({ loaded: false }).then(async () => {
      try {
        console.log("Initializing SDK...");
        const first = await fetchLabelsFirst(100);
        setAll(first);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        SDK.notifyLoadSucceeded();
        console.log("SDK initialized.");
        await SDK.ready();
        console.log("SDK ready.");
      }
    });
  }, []);

  // Background full load
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        console.log("Fetching all labels...");
        const full = await fetchAllLabels(500);
  if (!disposed) { setAll(full); setLoadedAll(true); }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { disposed = true; };
  }, []);

  if (loading) return (<Page className="container"><Surface background={SurfaceBackground.neutral}><Spinner size={SpinnerSize.large} /></Surface></Page>);

  if (selected) {
    return <LabelDetails label={selected} onBack={() => setSelected(null)} />;
  }

  return (<LabelsList items={all} initialCount={Math.min(100, all.length)} onSelect={(i) => setSelected(i)} onLoadedCount={() => {}} loadedAll={loadedAll} />);
}

ReactDOM.render(<Hub />, document.getElementById('root'));
