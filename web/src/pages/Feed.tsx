import React, { useState } from 'react';
import { FeedCard } from '@/components/feed/FeedCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Search, Filter, Sparkles, Loader2 } from 'lucide-react';
import { useFeed } from '@/hooks/use-feed';

const FEATURED_SCIENTISTS = [
  { id: '1', name: 'Dr. Stone', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stone' },
  { id: '2', name: 'Curie Lab', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Curie' },
  { id: '3', name: 'Feynman', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Feynman' },
  { id: '4', name: 'Turing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Turing' },
  { id: '5', name: 'Lovelace', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lovelace' },
  { id: '6', name: 'Hawking', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hawking' },
  { id: '7', name: 'Darwin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Darwin' },
];

const Feed = () => {
  const { data: filteredPosts, isLoading } = useFeed('All');

  return (
    <div className="min-h-screen bg-yellow-400 cube-bg flex flex-col">
       {/* 
         NOTE: We might replace the main Navbar later, but for now we keep it 
         to maintain navigation to other parts of the app (like Studio).
       */}
       <Navbar /> 

       {/* FEED CONTENT */}
       <main className="flex-1 max-w-xl mx-auto w-full p-4 md:p-8">
          <div className="flex flex-col gap-8">
             
             {/* STORIES RAIL */}
             <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
               {FEATURED_SCIENTISTS.map(scientist => (
                 <div key={scientist.id} className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer group">
                   <div className="w-18 h-18 rounded-full p-1 bg-gradient-to-tr from-black to-slate-800 group-hover:scale-105 transition-all shadow-md">
                     <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                       <img src={scientist.avatar} alt={scientist.name} className="w-full h-full object-cover" />
                     </div>
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-wide truncate w-full text-center text-black/80 shadow-sm">{scientist.name}</span>
                 </div>
               ))}
             </div>

             {/* SEARCH & FILTER */}
             <div className="flex gap-2">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search papers..." 
                     className="w-full pl-9 pr-4 py-3 border-4 border-black font-mono text-sm focus:outline-none focus:ring-0 shadow-[4px_4px_0px_black] bg-white"
                   />
                </div>
                <Button variant="outline" size="icon" className="w-12 h-12 border-4 border-black rounded-none shadow-[4px_4px_0px_black] bg-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_black] transition-all">
                   <Filter size={20} />
                </Button>
             </div>

             {/* POSTS */}
             {isLoading ? (
               <div className="flex items-center justify-center py-20">
                 <Loader2 className="animate-spin w-12 h-12 text-black" />
               </div>
             ) : (
               filteredPosts?.map(post => (
                 <FeedCard key={post.id} post={post} />
               ))
             )}
          </div>
       </main>

       <Footer />
    </div>
  );
};

export default Feed;
