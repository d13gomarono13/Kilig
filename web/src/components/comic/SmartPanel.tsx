import React, { useState, useEffect } from 'react';
import { ComicPanelData } from './types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { renderTemplate } from './templates';
import RevideoCard from '../video/RevideoCard';
import { useVoiceover } from '@/hooks/use-voiceover';

interface SmartPanelProps {
  data: ComicPanelData;
  isActive: boolean; // True if the Guided View is currently focused on this panel
  onClick: () => void;
  showTitle?: boolean;
}

export const SmartPanel: React.FC<SmartPanelProps> = ({ data, isActive, onClick, showTitle = true }) => {
  const [showLiveContent, setShowLiveContent] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  // Voiceover hook for panel narration
  const { speak, stop, isLoading: isVoiceLoading, isPlaying } = useVoiceover();
  const narrativeText = data.narrative || data.content || '';

  // Auto-play narration when panel becomes active
  useEffect(() => {
    if (isActive && narrativeText.length > 10) {
      speak(narrativeText);
    } else if (!isActive) {
      stop();
    }
  }, [isActive, narrativeText]);

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
        "relative overflow-hidden bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer",
        isActive && "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50"
      )}
      style={{
        gridColumnStart: data.layout.x,
        gridColumnEnd: `span ${data.layout.w}`,
        gridRowStart: data.layout.y,
        gridRowEnd: `span ${data.layout.h}`,
      }}
      onClick={onClick}
      layoutId={`panel-${data.id}`}
    >
      {/* HEADER / TITLE */}
      {showTitle && data.title && (
        <div className="absolute top-0 left-0 bg-yellow-300 border-b border-r border-black px-3 py-1 z-10">
          <h3 className="font-bold text-sm uppercase tracking-wider">{data.title}</h3>
        </div>
      )}

      {/* VOICEOVER CONTROL */}
      {narrativeText.length > 10 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            isPlaying ? stop() : speak(narrativeText);
          }}
          className={cn(
            "absolute top-0 right-0 z-20 p-2 border-b border-l border-black transition-colors",
            isPlaying ? "bg-red-400 text-white" : "bg-blue-400 text-white"
          )}
          title={isPlaying ? "Stop narration" : "Play narration"}
        >
          {isVoiceLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <VolumeX size={16} />
          ) : (
            <Volume2 size={16} />
          )}
        </button>
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
            <div className="prose prose-sm leading-snug relative z-10 overflow-y-auto no-scrollbar">
              <p>{data.content}</p>
            </div>
          </>
        )}

        {/* Type: REVIDEO SCENE */}
        {data.type === 'revideo-scene' && (
          <div className="flex-1 w-full h-full relative bg-gray-100 border-2 border-black rounded-sm overflow-hidden no-scrollbar">
            <RevideoCard scene={data.revideo?.data} isActive={isActive} />
          </div>
        )}

        {/* Type: REVIDEO / CHART */}
        {data.type === 'revideo' && (
          <div className="flex-1 w-full h-full relative bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md overflow-hidden no-scrollbar">
            <AnimatePresence mode="wait">
              {showLiveContent && !hasEnded ? (
                <motion.div
                  key="player"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden no-scrollbar"
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
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 no-scrollbar"
                >
                  {data.revideo?.thumbnailUrl ? (
                    <>
                      <img
                        src={data.revideo.thumbnailUrl}
                        alt="Preview"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <span className="text-4xl drop-shadow-md filter">{hasEnded ? "🔄" : "🎬"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl">{hasEnded ? "🔄" : "🎬"}</span>
                      <span className="text-xs text-blue-500 font-bold mt-2 uppercase tracking-tighter">
                        {hasEnded ? "Replay Visual" : "Click to Play"}
                      </span>
                    </>
                  )}

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
          <div className="flex-1 w-full h-full bg-slate-900 p-2 rounded text-xs font-mono text-green-400 overflow-y-auto no-scrollbar">
            <pre>{data.codeSnippet?.code}</pre>
          </div>
        )}
      </div>
    </motion.div>
  );
};
