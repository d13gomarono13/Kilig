import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ComicManifest } from '../components/comic/types';
import { MANIFESTS } from '../components/comic/demo-data';
import { ComicViewer } from '../components/comic/ComicViewer';
import { ComicEditor } from '../components/comic/ComicEditor';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const Workbench = () => {
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get('paper') || 'paper-1';
  
  // Initialize with the correct paper or fallback to paper-1
  const [manifest, setManifest] = useState<ComicManifest>(MANIFESTS[paperId] || MANIFESTS['paper-1']);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  // Update manifest if URL changes or fetch generated
  useEffect(() => {
    if (paperId === 'generated') {
      fetch('/src/data/comic-manifest.json')
        .then(res => res.json())
        .then(data => setManifest(data))
        .catch(err => console.error("Failed to load generated manifest", err));
    } else {
      const data = MANIFESTS[paperId];
      if (data) setManifest(data);
    }
  }, [paperId]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <ResizablePanelGroup direction="horizontal">
        
        {/* LEFT SIDEBAR: EDITOR */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="z-10 bg-white shadow-xl">
           <ComicEditor 
             manifest={manifest} 
             onChange={setManifest} 
             selectedPanelId={selectedPanelId}
             onSelectPanel={setSelectedPanelId}
           />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT CONTENT: VIEWER */}
        <ResizablePanel defaultSize={75}>
          <ComicViewer manifest={manifest} />
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
};

export default Workbench;