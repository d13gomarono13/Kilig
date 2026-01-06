import React from 'react';
import { MOCK_PROFILE } from '@/data/profile-data';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FeedCard } from '@/components/feed/FeedCard';
import { Button, Tabs, TabsPanels, TabsTrigger, TabsContent, TabsTriggerList, Badge } from "@/components/retroui";
import { Edit, Settings, MapPin, Link as LinkIcon, BookOpen, Heart, FileDashed } from 'lucide-react';

const Profile = () => {
  const profile = MOCK_PROFILE;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        
        {/* PROFILE HEADER */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_black] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
           {/* Avatar */}
           <div className="relative">
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-black bg-slate-50 object-cover"
              />
              <Badge className="absolute -bottom-2 -right-2 bg-yellow-400 text-black border-2 border-black text-sm px-3 py-1">
                 Lv. {Math.floor(profile.stats.reputation / 100)}
              </Badge>
           </div>

           {/* Info */}
           <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">{profile.name}</h1>
                    <p className="text-lg font-bold text-slate-500">{profile.role}</p>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-2 border-black rounded-none shadow-[2px_2px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                       <Edit size={16} className="mr-2"/> Edit Profile
                    </Button>
                    <Button variant="outline" size="icon" className="border-2 border-black rounded-none shadow-[2px_2px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                       <Settings size={18} />
                    </Button>
                 </div>
              </div>

              <p className="text-medium font-medium max-w-2xl border-l-4 border-black pl-4 py-1 bg-slate-50">
                 "{profile.bio}"
              </p>

              <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-600">
                 <span className="flex items-center gap-1"><MapPin size={16}/> {profile.institution}</span>
                 <span className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer"><LinkIcon size={16}/> kilig.science/u/{profile.id}</span>
              </div>

              {/* Stats Grid */}
              <div className="flex gap-8 pt-4 border-t-2 border-slate-100">
                 <div className="text-center">
                    <div className="text-2xl font-black">{profile.stats.works}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-500">Works</div>
                 </div>
                 <div className="text-center">
                    <div className="text-2xl font-black">{profile.stats.reputation}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-500">Reputation</div>
                 </div>
                 <div className="text-center">
                    <div className="text-2xl font-black">{profile.stats.followers}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-500">Followers</div>
                 </div>
                 <div className="text-center">
                    <div className="text-2xl font-black">{profile.stats.following}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-500">Following</div>
                 </div>
              </div>
           </div>
        </div>

        {/* TABS & CONTENT */}
        <Tabs>
           <TabsTriggerList className="border-b-4 border-black bg-white space-x-0">
              <TabsTrigger className="rounded-none border-r-4 border-b-0 border-transparent border-r-black px-8 py-4 font-black uppercase text-sm data-selected:bg-black data-selected:text-white hover:bg-slate-100 transition-colors flex items-center gap-2">
                 <BookOpen size={18} /> My Works
              </TabsTrigger>
              <TabsTrigger className="rounded-none border-r-4 border-b-0 border-transparent border-r-black px-8 py-4 font-black uppercase text-sm data-selected:bg-black data-selected:text-white hover:bg-slate-100 transition-colors flex items-center gap-2">
                 <Heart size={18} /> Saved
              </TabsTrigger>
              <TabsTrigger className="rounded-none border-b-0 border-transparent px-8 py-4 font-black uppercase text-sm data-selected:bg-black data-selected:text-white hover:bg-slate-100 transition-colors flex items-center gap-2">
                 <FileDashed size={18} /> Drafts ({profile.drafts.length})
              </TabsTrigger>
           </TabsTriggerList>

           <TabsPanels className="mt-8">
              {/* MY WORKS */}
              <TabsContent className="border-0 p-0 mt-0 focus:outline-none">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {profile.posts.map(post => (
                       <FeedCard key={post.id} post={post} />
                    ))}
                 </div>
              </TabsContent>

              {/* SAVED */}
              <TabsContent className="border-0 p-0 mt-0 focus:outline-none">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {profile.saved.map(post => (
                       <FeedCard key={post.id} post={post} />
                    ))}
                 </div>
              </TabsContent>

              {/* DRAFTS */}
              <TabsContent className="border-0 p-0 mt-0 focus:outline-none">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {profile.drafts.map(post => (
                       <div key={post.id} className="opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer border-4 border-dashed border-black bg-slate-50 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                          <div className="bg-slate-200 p-4 rounded-full">
                             <FileDashed size={32} className="text-slate-500" />
                          </div>
                          <h3 className="text-xl font-black uppercase">{post.title}</h3>
                          <p className="font-mono text-sm text-slate-500">{post.timestamp}</p>
                          <Button size="sm" className="border-2 border-black">Continue Editing</Button>
                       </div>
                    ))}
                 </div>
              </TabsContent>
           </TabsPanels>
        </Tabs>

      </main>

      <Footer />
    </div>
  );
};

export default Profile;
