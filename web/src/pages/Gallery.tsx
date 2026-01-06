import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StarIcon, Check, LoaderCircle, CircleArrowRight, XCircle } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  status: "waiting" | "done" | "expired";
  queuePosition?: number;
}

const projects: Project[] = [
  {
    id: "1",
    title: "Project 1",
    description: "Deep dive into the architectural patterns of modern autonomous agent systems.",
    status: "done",
  },
  {
    id: "2",
    title: "Project 2",
    description: "Analyzing the efficiency of OKLCH color spaces in neo-brutalist web design.",
    status: "waiting",
    queuePosition: 2,
  },
  {
    id: "3",
    title: "Project 3",
    description: "Comparative study of React 18 vs React 19 concurrent rendering pipelines.",
    status: "expired",
  },
  {
    id: "4",
    title: "Project 4",
    description: "Neural network visualization with custom shader implementations in Three.js.",
    status: "done",
  },
  {
    id: "5",
    title: "Project 5",
    description: "Exploring the intersection of generative AI and traditional printmaking techniques.",
    status: "waiting",
    queuePosition: 5,
  },
  {
    id: "6",
    title: "Project 6",
    description: "Real-time data visualization of global climate patterns using D3.js.",
    status: "done",
  },
];

const RetroCard = ({ project }: { project: Project }) => {
    const isPastEvent = project.status === "expired";
    const imageUrl = `https://picsum.photos/seed/${project.id}/800/400`; // Random consistent image

    return (
        <Card className={`rounded-none overflow-hidden transition-all duration-200 relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${isPastEvent ? "opacity-75" : ""}`}>
            <div className="relative w-full h-48 border-b-4 border-black">
                <img src={imageUrl} alt={project.title} className='w-full h-full object-cover grayscale hover:grayscale-0 transition-all'/>
            </div>
            <div className="p-6">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{project.title}</h2>
                <div className="flex gap-2 mt-2">
                    <Badge className="bg-yellow-400 text-black border-2 border-black rounded-none hover:bg-yellow-500">Human Made</Badge>
                    <Badge variant="outline" className="border-2 border-black rounded-none">Illustration</Badge>
                </div>
                <p className="mt-4 text-black font-medium line-clamp-2 border-l-4 border-black pl-3">
                    {project.description}
                </p>
            </div>
        </Card>
    );
};

export default function Gallery() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  return (
    <div className="min-h-screen flex flex-col bg-yellow-400 cube-bg">
      <Navbar />

      <div className="p-4 sticky top-20 z-40 pointer-events-none">
          <div className="max-w-7xl mx-auto flex justify-end items-center pointer-events-auto">
              <Link to="/">
                  <Button className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                      Back to Home
                  </Button>
              </Link>
          </div>
      </div>
      
      <main className="flex-1 px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-6">
              <h1 className="text-6xl font-black uppercase tracking-tighter">Gallery</h1>
              <p className="text-xl font-medium text-slate-600 max-w-2xl mx-auto">
                  Showcasing the most popular scientific comics from the community.
              </p>
              
              <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => setTimeRange('week')}
                    className={`rounded-full px-8 py-6 text-lg font-black uppercase tracking-wider border-4 border-black transition-all ${
                        timeRange === 'week' 
                        ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-white text-slate-400 shadow-none hover:bg-slate-50'
                    }`}
                  >
                    Best of Week
                  </Button>
                  <Button 
                    onClick={() => setTimeRange('month')}
                    className={`rounded-full px-8 py-6 text-lg font-black uppercase tracking-wider border-4 border-black transition-all ${
                        timeRange === 'month' 
                        ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-white text-slate-400 shadow-none hover:bg-slate-50'
                    }`}
                  >
                    Best of Month
                  </Button>
              </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {projects.map((project) => (
              <RetroCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

