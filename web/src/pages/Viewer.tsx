import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ComicManifest } from '../components/comic/types';
import { MANIFESTS } from '../components/comic/demo-data';
import { ComicViewer } from '../components/comic/ComicViewer';

const Viewer = () => {
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get('paper') || 'paper-1';
  
  const [manifest, setManifest] = useState<ComicManifest>(MANIFESTS[paperId] || MANIFESTS['paper-1']);
  // We can keep track of selected panel for zooming, but we won't show the editor.
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  const reloadManifest = () => {
    if (paperId === 'generated') {
      fetch('/src/data/comic-manifest.json')
        .then(res => res.json())
        .then(data => {
          setManifest(data);
          console.log("Manifest reloaded from disk");
        })
        .catch(err => console.error("Failed to load generated manifest", err));
    } else {
      const data = MANIFESTS[paperId];
      if (data) setManifest(data);
    }
  };

  useEffect(() => {
    reloadManifest();
  }, [paperId]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <ComicViewer 
        manifest={manifest} 
        selectedPanelId={selectedPanelId}
        onSelectPanel={setSelectedPanelId}
        backLink="/library"
        backLabel="Back to Library"
      />
    </div>
  );
};

export default Viewer;
