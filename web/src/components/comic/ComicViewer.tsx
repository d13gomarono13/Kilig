import React, { useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { ComicManifest, ComicPanelData } from './types';
import { SmartPanel } from './SmartPanel';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComicViewerProps {
  manifest: ComicManifest;
}

export const ComicViewer: React.FC<ComicViewerProps> = ({ manifest }) => {
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(-1); // -1 = Full View

  // Flatten all panels across pages for sequential navigation
  const allPanels = manifest.pages.flatMap(p => p.panels);

  const handleZoomToPanel = (panelId: string, index: number) => {
    if (!transformRef.current) return;
    
    setActivePanelId(panelId);
    setCurrentPanelIndex(index);

    // Calculate dynamic scale to fit panel perfectly
    const { instance } = transformRef.current;
    const wrapper = instance.wrapperComponent;
    const panel = document.getElementById(`panel-${panelId}`);

    if (wrapper && panel) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      
      // Calculate the current scale to normalize dimensions
      const currentScale = instance.transformState.scale;
      const naturalPanelWidth = panelRect.width / currentScale;
      const naturalPanelHeight = panelRect.height / currentScale;

      // Calculate target scale (fit width or height, whichever is smaller)
      // 0.65 factor adds comfortable padding to prevent clipping
      const scaleX = wrapperRect.width / naturalPanelWidth;
      const scaleY = wrapperRect.height / naturalPanelHeight;
      const targetScale = Math.min(scaleX, scaleY) * 0.65;

      // Limit zoom levels
      const finalScale = Math.min(Math.max(targetScale, 0.5), 4);

      const { zoomToElement } = transformRef.current;
      zoomToElement(`panel-${panelId}`, finalScale, 600, "easeInOutQuad");
    }
  };

  const handleReset = () => {
    if (!transformRef.current) return;
    setActivePanelId(null);
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
      <div className="bg-white border-b-4 border-black flex items-center justify-between px-4 py-4 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <Button variant="outline" size="icon" onClick={() => transformRef.current?.zoomIn()} title="Zoom In"><ZoomIn size={16}/></Button>
             <Button variant="outline" size="icon" onClick={() => transformRef.current?.zoomOut()} title="Zoom Out"><ZoomOut size={16}/></Button>
             <Button variant="outline" size="icon" onClick={handleReset} title="Reset View"><RotateCcw size={16}/></Button>
          </div>
          
          <div className="flex items-center gap-2">
             <Button 
               onClick={handlePrev} 
               disabled={currentPanelIndex < 0}
               className="bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all h-9 px-4"
             >
               <ChevronLeft size={16} className="mr-1"/> Prev
             </Button>
             <Button 
               onClick={handleNext}
               className="bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all h-9 px-4"
             >
               Next Panel <ChevronRight size={16} className="ml-1"/>
             </Button>
          </div>
        </div>

        <Link to="/">
          <Button className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
            Back to Home
          </Button>
        </Link>
      </div>

      {/* CANVAS */}
      <div className="flex-1 w-full overflow-y-auto cursor-grab active:cursor-grabbing bg-slate-200">
        <TransformWrapper
          ref={transformRef}
          initialScale={0.6}
          minScale={0.2}
          maxScale={4}
          centerOnInit={true}
          limitToBounds={false}
          wheel={{ disabled: true }}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent wrapperClass="!w-full min-h-full" contentClass="flex items-center justify-center min-h-full p-4">
            
            {/* THE "PAGE" CONTAINER */}
            <div className="bg-white shadow-2xl p-0 border-2 border-black" style={{ width: '1000px', aspectRatio: '1/1.414' }}> {/* A4 Ratio */}
                {manifest.pages.map(page => (
                   <div 
                     key={page.id} 
                     className="grid grid-cols-6 gap-0 w-full h-full"
                     style={{ gridTemplateRows: 'repeat(8, 1fr)' }} 
                   >
                      {page.panels.map((panel, idx) => {
                         // Calculate global index for this panel
                         const globalIdx = allPanels.findIndex(p => p.id === panel.id);
                         return (
                           <SmartPanel 
                             key={panel.id}
                             data={panel}
                             isActive={activePanelId === panel.id}
                             onClick={() => handleZoomToPanel(panel.id, globalIdx)}
                           />
                         );
                      })}
                   </div>
                ))}
            </div>

          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
};
