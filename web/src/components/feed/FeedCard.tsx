import React from 'react';
import { FeedPost } from '@/data/feed-data';
import { SmartPanel } from '../comic/SmartPanel';
import { Heart, Bookmark, Share2, MoreHorizontal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const FIELD_COLORS: Record<string, string> = {
  'Physics': 'bg-purple-100 text-purple-900 border-purple-900',
  'Biology': 'bg-green-100 text-green-900 border-green-900',
  'CS': 'bg-blue-100 text-blue-900 border-blue-900',
  'Math': 'bg-red-100 text-red-900 border-red-900',
  'Chemistry': 'bg-amber-100 text-amber-900 border-amber-900',
};

export const FeedCard = ({ post }: { post: FeedPost }) => {
  // Find the first interesting panel (revideo) or fallback to first panel
  const heroPanel = post.manifest.pages[0].panels.find(p => p.type === 'revideo') || post.manifest.pages[0].panels[0];

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col h-full">
      
      {/* HEADER */}
      <div className="p-4 border-b-4 border-black flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <img src={post.author.avatarUrl} alt={post.author.name} className="w-10 h-10 rounded-full border-2 border-black bg-white" />
          <div>
            <p className="font-bold text-sm leading-tight">{post.author.name}</p>
            <p className="text-xs text-slate-500 font-mono">{post.author.role} • {post.timestamp}</p>
          </div>
        </div>
        <Badge className={`border-2 rounded-none ${FIELD_COLORS[post.field] || 'bg-gray-100'}`}>
          {post.field}
        </Badge>
      </div>

      {/* CONTENT PREVIEW */}
      <div className="p-4 flex-1 space-y-4">
        <Link to={`/workbench?paper=${post.id.replace('post-', 'paper-')}`} className="block group">
            <h3 className="text-2xl font-black uppercase leading-none mb-2 group-hover:underline decoration-4 underline-offset-4 decoration-yellow-400">
                {post.title}
            </h3>
        </Link>
        <p className="text-sm font-medium text-slate-700 line-clamp-3">
            {post.abstract}
        </p>

        {/* HERO PANEL PREVIEW */}
        <div className="aspect-video w-full border-2 border-black relative rounded-md overflow-hidden bg-gray-100">
             {/* We wrap SmartPanel to strip interaction logic for the feed card */}
             <div className="absolute inset-0 pointer-events-none">
                <SmartPanel 
                    data={{...heroPanel, layout: {x:1, y:1, w:1, h:1}}} // Override layout for preview container
                    isActive={false} 
                    onClick={() => {}} 
                />
             </div>
             <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                <Button className="bg-white text-black border-2 border-black hover:bg-yellow-400">
                    <Zap size={16} className="mr-2"/> Read Comic
                </Button>
             </div>
        </div>
        
        {/* TAGS */}
        <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-slate-500">#{tag}</span>
            ))}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p-3 border-t-4 border-black flex items-center justify-between bg-white">
         <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="hover:bg-red-100 hover:text-red-600 gap-1 font-bold">
                <Heart size={18} /> {post.likes}
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-blue-100 hover:text-blue-600 gap-1 font-bold">
                <Bookmark size={18} /> {post.saves}
            </Button>
         </div>
         <Button variant="ghost" size="icon">
            <Share2 size={18} />
         </Button>
      </div>
    </div>
  );
};
