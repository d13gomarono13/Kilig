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

       {/* STICKY SUB-HEADER */}
       <div className="sticky top-0 z-40 bg-white border-b-4 border-black px-4 py-3 shadow-md">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Stories / Accounts Rail */}
            <div className="flex items-center gap-4 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
               {/* Add a 'Your Story' or 'New' circle optionally, but sticking to the request for user circles */}
               {FEATURED_SCIENTISTS.map(scientist => (
                 <div key={scientist.id} className="flex flex-col items-center gap-1 min-w-[64px] cursor-pointer group">
                   <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-yellow-400 to-red-500 group-hover:from-yellow-300 group-hover:to-red-400 transition-all">
                     <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                       <img src={scientist.avatar} alt={scientist.name} className="w-full h-full object-cover" />
                     </div>
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-wide truncate w-full text-center">{scientist.name}</span>
                 </div>
               ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search papers..." 
                    className="w-full pl-9 pr-4 py-2 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
               </div>
               <Button variant="outline" size="icon" className="border-2 border-black rounded-none">
                  <Filter size={18} />
               </Button>
            </div>
         </div>
       </div>

       {/* FEED CONTENT */}
       <main className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-8">
          <div className="flex flex-col gap-12">
             {/* Featured / AI Generated Promotion Card - Made much smaller */}
             <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 border-4 border-black shadow-[4px_4px_0px_black] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-2 rounded-full">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase leading-none">Generate Your Own</h2>
                    <p className="text-xs font-bold text-black/80">Turn papers into comics with AI.</p>
                  </div>
                </div>
                <Button size="sm" className="border-2 border-black shadow-[2px_2px_0px_black] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all bg-white text-black hover:bg-slate-50 text-xs font-black uppercase">
                   Start Lab
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
