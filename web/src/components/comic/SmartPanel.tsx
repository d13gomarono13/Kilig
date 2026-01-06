import React, { useState, useEffect } from 'react';
import { ComicPanelData } from './types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { renderTemplate } from './templates';

interface SmartPanelProps {
  data: ComicPanelData;
  isActive: boolean; // True if the Guided View is currently focused on this panel
  onClick: () => void;
}

export const SmartPanel: React.FC<SmartPanelProps> = ({ data, isActive, onClick }) => {
  const [showLiveContent, setShowLiveContent] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  // When active (zoomed in), delay slightly then show live content
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShowLiveContent(true);
        setHasEnded(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowLiveContent(false);
      setHasEnded(false);
    }
  }, [isActive]);

  // Auto-stop the "video" after 5 seconds and return to thumb
  useEffect(() => {
    if (showLiveContent && !hasEnded) {
      const timer = setTimeout(() => {
        setHasEnded(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showLiveContent, hasEnded]);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasEnded(false);
  };

  return (
    <motion.div
      id={`panel-${data.id}`}
      className={cn(
        "relative overflow-hidden bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer",
        isActive && "shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-50"
      )}
      style={{
        gridColumn: `span ${data.layout.w}`,
        gridRow: `span ${data.layout.h}`,
      }}
      onClick={onClick}
      layoutId={`panel-${data.id}`}
    >
      {/* HEADER / TITLE */}
      {data.title && (
        <div className="absolute top-0 left-0 bg-yellow-300 border-b-2 border-r-2 border-black px-3 py-1 z-10">
          <h3 className="font-bold text-sm uppercase tracking-wider">{data.title}</h3>
        </div>
      )}

      {/* CONTENT LAYER */}
      <div className="w-full h-full flex flex-col p-4 pt-10 relative">
        
        {/* Type: STATIC TEXT */}
        {data.type === 'static' && (
           <>
             {data.imageUrl && (
               <div className="absolute inset-0 z-0">
                 <img src={data.imageUrl} className="w-full h-full object-cover opacity-30" alt="" />
               </div>
             )}
             <div className="prose prose-sm leading-snug relative z-10">
               <p>{data.content}</p>
             </div>
           </>
        )}

        {/* Type: REVIDEO / CHART */}
        {data.type === 'revideo' && (
          <div className="flex-1 w-full h-full relative bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md overflow-hidden">
             <AnimatePresence mode="wait">
               {showLiveContent && !hasEnded ? (
                 <motion.div 
                   key="player"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden"
                 >
                   {/* DYNAMIC TEMPLATE RENDERER */}
                   {data.revideo && renderTemplate(data.revideo.templateId, data.revideo.data)}
                 </motion.div>
               ) : (
                 <motion.div
                   key="thumb"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50"
                 >
                    <span className="text-4xl">{hasEnded ? "🔄" : "🎬"}</span>
                    <span className="text-xs text-blue-500 font-bold mt-2 uppercase tracking-tighter">
                      {hasEnded ? "Replay Visual" : "Click to Play"}
                    </span>
                    
                    {/* If we returned to thumb while still zoomed in, show a clearer Replay button */}
                    {hasEnded && isActive && (
                      <button 
                        onClick={handleReplay}
                        className="mt-4 bg-white border-2 border-black text-black px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2"
                      >
                        <RotateCcw size={14} /> REPLAY
                      </button>
                    )}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}

        {/* Type: CODE */}
        {data.type === 'code' && (
          <div className="flex-1 w-full h-full bg-slate-900 p-2 rounded text-xs font-mono text-green-400 overflow-hidden">
             <pre>{data.codeSnippet?.code}</pre>
          </div>
        )}
      </div>
    </motion.div>
  );
};
