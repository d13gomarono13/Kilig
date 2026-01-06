import React, { useState } from 'react';
import { MOCK_FEED } from '@/data/feed-data';
import { FeedCard } from '@/components/feed/FeedCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Search, Filter, Sparkles } from 'lucide-react';

const FIELDS = ['All', 'Physics', 'Biology', 'CS', 'Math', 'Chemistry'];

const Feed = () => {
  const [activeField, setActiveField] = useState('All');

  const filteredPosts = activeField === 'All' 
    ? MOCK_FEED 
    : MOCK_FEED.filter(p => p.field === activeField);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
       {/* 
         NOTE: We might replace the main Navbar later, but for now we keep it 
         to maintain navigation to other parts of the app (like Studio).
       */}
       <Navbar /> 

       {/* STICKY SUB-HEADER */}
       <div className="sticky top-0 z-40 bg-white border-b-4 border-black px-4 py-3 shadow-md">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Field Selector */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
               {FIELDS.map(field => (
                 <button
                   key={field}
                   onClick={() => setActiveField(field)}
                   className={`
                     px-4 py-1.5 font-bold text-sm border-2 border-black transition-all
                     ${activeField === field 
                        ? 'bg-black text-white shadow-[2px_2px_0px_rgba(100,100,100,1)]' 
                        : 'bg-white hover:bg-slate-50 hover:-translate-y-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                     }
                   `}
                 >
                   {field}
                 </button>
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
       <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* Featured / AI Generated Promotion Card? */}
             <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 border-4 border-black shadow-[8px_8px_0px_black] p-6 flex flex-col justify-center items-center text-center space-y-4">
                <div className="bg-black text-white p-3 rounded-full">
                   <Sparkles size={32} />
                </div>
                <h2 className="text-3xl font-black uppercase leading-tight">Generate Your Own</h2>
                <p className="font-medium text-black/80">Turn any paper into a comic in minutes using our AI agents.</p>
                <Button className="w-full border-2 border-black shadow-[4px_4px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white text-black hover:bg-slate-50">
                   Start Laboratory
                </Button>
             </div>

             {/* POSTS */}
             {filteredPosts.map(post => (
               <FeedCard key={post.id} post={post} />
             ))}
          </div>
       </main>

       <Footer />
    </div>
  );
};

export default Feed;
