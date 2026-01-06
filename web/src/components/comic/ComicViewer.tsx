import React, { useRef, useState, useMemo, useEffect } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { ComicManifest } from './types';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(-1); // -1 = Full View
  const [isSyncing, setIsSyncing] = useState(false);

  // Constants for layout
  const PAGE_HEIGHT = 1414;
  const PAGE_GAP = 80; // gap-20 = 80px
  const PADDING = 80; // p-20 = 80px

  const allPanels = useMemo(() => manifest.pages.flatMap(p => p.panels), [manifest]);

  // Sync scroll container with transform
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isSyncing || !transformRef.current) return;
      const { setTransform } = transformRef.current;
      const { scale, positionX } = transformRef.current.instance.transformState;
      
      // Map scroll top to position Y
      // We invert it because panning down means positionY becomes more negative
      const newY = -scrollContainer.scrollTop;
      
      setTransform(positionX, newY, scale, 0);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isSyncing]);

  // Sync internal index when external selection changes
  useEffect(() => {
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

    setTimeout(() => {
      if (!transformRef.current) return;
      const { instance } = transformRef.current;
      const wrapper = instance.wrapperComponent;
      const panel = document.getElementById(`panel-${panelId}`);

      if (wrapper && panel) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const naturalPanelWidth = (panel as HTMLElement).offsetWidth;
        const naturalPanelHeight = (panel as HTMLElement).offsetHeight;

        const scaleX = (wrapperRect.width - 120) / naturalPanelWidth;
        const scaleY = (wrapperRect.height - 120) / naturalPanelHeight;
        const targetScale = Math.min(scaleX, scaleY);
        const finalScale = Math.min(Math.max(targetScale, 0.5), 2.5);

        transformRef.current.zoomToElement(`panel-${panelId}`, finalScale, 600, "easeInOutQuad");
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
    <div className="w-full h-full bg-slate-100 flex flex-col overflow-hidden">
      
      {/* TOOLBAR */}
      <div className="bg-white border-b-4 border-black flex items-center justify-between px-4 py-4 z-50 shadow-sm">
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

      {/* CANVAS AREA WITH FORCED SCROLLBAR */}
      <div className="flex-1 w-full relative overflow-y-scroll no-scrollbar-inner bg-slate-200" ref={scrollContainerRef}>
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
           {/* This TransformWrapper is fixed relative to the visible area */}
           <div className="sticky top-0 left-0 w-full h-[calc(100vh-84px)] pointer-events-auto">
              <TransformWrapper
                ref={transformRef}
                initialScale={0.6}
                minScale={0.1}
                maxScale={4}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{ disabled: false }}
                pinch={{ disabled: false }}
                doubleClick={{ disabled: true }}
              >
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="flex flex-col items-center gap-20 p-20">
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
        
        {/* Invisible spacer to enable the vertical scrollbar on the right */}
        <div 
          style={{ 
            height: `${manifest.pages.length * (PAGE_HEIGHT + PAGE_GAP) + (PADDING * 2)}px`,
            width: '1px' 
          }} 
          className="pointer-events-none"
        />
      </div>
    </div>
  );
};
