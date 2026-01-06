import React, { useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { ComicManifest, ComicPanelData } from './types';
import { SmartPanel } from './SmartPanel';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComicViewerProps {
  manifest: ComicManifest;
  selectedPanelId?: string | null;
  onSelectPanel?: (id: string | null) => void;
}

export const ComicViewer: React.FC<ComicViewerProps> = ({ manifest, selectedPanelId, onSelectPanel }) => {
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(-1); // -1 = Full View

  // Flatten all panels across pages for sequential navigation
  const allPanels = React.useMemo(() => manifest.pages.flatMap(p => p.panels), [manifest]);

  // Sync internal index when external selection changes
  React.useEffect(() => {
    if (selectedPanelId) {
      const index = allPanels.findIndex(p => p.id === selectedPanelId);
      if (index !== -1) {
        handleZoomToPanel(selectedPanelId, index, false); 
      }
    } else if (selectedPanelId === null && currentPanelIndex !== -1) {
      handleReset(false);
    }
  }, [selectedPanelId, allPanels]);

  const handleZoomToPanel = (panelId: string, index: number, updateExternal = true) => {
    if (!transformRef.current) return;
    
    setActivePanelId(panelId);
    if (updateExternal && onSelectPanel) onSelectPanel(panelId);
    setCurrentPanelIndex(index);

    // Calculate dynamic scale to fit panel perfectly
    const { instance } = transformRef.current;
    const wrapper = instance.wrapperComponent;
    
    // Slight delay to ensure DOM is ready
    setTimeout(() => {
      const panel = document.getElementById(`panel-${panelId}`);

      if (wrapper && panel) {
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Use offset dimensions for natural size
        const naturalPanelWidth = (panel as HTMLElement).offsetWidth;
        const naturalPanelHeight = (panel as HTMLElement).offsetHeight;

        // Calculate target scale with comfortable margin
        const scaleX = (wrapperRect.width - 100) / naturalPanelWidth;
        const scaleY = (wrapperRect.height - 100) / naturalPanelHeight;
        const targetScale = Math.min(scaleX, scaleY);

        // Limit zoom levels
        const finalScale = Math.min(Math.max(targetScale, 0.5), 2.5);

        const { zoomToElement } = transformRef.current;
        zoomToElement(`panel-${panelId}`, finalScale, 600, "easeInOutQuad");
      }
    }, 50);
  };

  const handleReset = (updateExternal = true) => {
    if (!transformRef.current) return;
    setActivePanelId(null);
    if (updateExternal && onSelectPanel) onSelectPanel(null);
    setCurrentPanelIndex(-1);
    transformRef.current.resetTransform();
  };

  const handleNext = () => {
    const nextIndex = currentPanelIndex + 1;
    if (nextIndex < allPanels.length) {
      handleZoomToPanel(allPanels[nextIndex].id, nextIndex);
    } else {
      // End of comic, zoom out
      handleReset();
    }
  };

  const handlePrev = () => {
    const prevIndex = currentPanelIndex - 1;
    if (prevIndex >= 0) {
      handleZoomToPanel(allPanels[prevIndex].id, prevIndex);
    } else {
      handleReset();
    }
  };

  return (
    <div className="w-full h-screen bg-slate-100 flex flex-col overflow-y-auto">
      
      {/* TOOLBAR */}
      <div className="bg-white border-b-4 border-black flex items-center justify-between px-4 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <Button variant="outline" size="icon" onClick={() => transformRef.current?.zoomIn()} title="Zoom In"><ZoomIn size={16}/></Button>
             <Button variant="outline" size="icon" onClick={() => transformRef.current?.zoomOut()} title="Zoom Out"><ZoomOut size={16}/></Button>
             <Button variant="outline" size="icon" onClick={() => handleReset()} title="Reset View"><RotateCcw size={16}/></Button>
          </div>
          
          <div className="flex items-center gap-2">
             <Button 
               onClick={handlePrev} 
               disabled={currentPanelIndex < 0}
               className="bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all h-9 px-4 disabled:opacity-50"
             >
               <ChevronLeft size={16} className="mr-1"/> Prev
             </Button>
             <Button 
               onClick={handleNext}
               className="bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all h-9 px-4"
             >
               Next <ChevronRight size={16} className="ml-1"/>
             </Button>
          </div>
        </div>

        <Link to="/laboratory">
          <Button className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
            Exit Editor
          </Button>
        </Link>
      </div>

      {/* CANVAS */}
      <div className="flex-1 w-full overflow-y-auto cursor-grab active:cursor-grabbing bg-slate-200">
        <TransformWrapper
          ref={transformRef}
          initialScale={0.6}
          minScale={0.1}
          maxScale={4}
          centerOnInit={true}
          limitToBounds={false}
          wheel={{ disabled: false }}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent wrapperClass="!w-full !h-full" contentClass="flex flex-col items-center gap-20 p-20">
            
            {/* THE "PAGE" CONTAINER */}
            {manifest.pages.map(page => (
               <div 
                 key={page.id} 
                 className="bg-white shadow-2xl p-0 border-2 border-black shrink-0 relative overflow-hidden" 
                 style={{ width: '1000px', height: '1414px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}
               >
                  {page.panels.map((panel) => {
                     const globalIdx = allPanels.findIndex(p => p.id === panel.id);
                     return (
                       <SmartPanel 
                         key={panel.id}
                         data={panel}
                         isActive={(selectedPanelId || activePanelId) === panel.id}
                         onClick={() => handleZoomToPanel(panel.id, globalIdx)}
                       />
                     );
                  })}
               </div>
            ))}

          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
};
