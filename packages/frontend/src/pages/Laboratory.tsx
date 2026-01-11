import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, FileText, FlaskConical, Atom, CheckCircle2, XCircle, Clock, Activity, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// Define the Research Areas
const RESEARCH_DOMAINS = [
  "AI", "Machine Learning", "Computer Vision", "NLP",
  "Combinatorics", "Numerical Analysis", "Optimization",
  "Computational Physics", "Biomedical Engineering", "Statistics",
  "Quantum Physics", "Astrophysics", "Quantitative Biology",
  "Neuroscience", "Signal Processing"
];

interface PipelineRun {
  id: string;
  domain: string;
  source_title: string;
  source_url: string;
  status: 'completed' | 'failed' | 'running' | 'pending';
  quality_score: number;
  total_duration_ms: number;
  created_at: string;
}

const Laboratory = () => {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/analytics/runs`);
        if (response.ok) {
          const data = await response.json();
          setRuns(data.runs || []);
        } else {
          console.error("Failed to fetch runs");
        }
      } catch (error) {
        console.error("Error fetching runs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, []);

  const getRunsByDomain = (domain: string) => {
    return runs.filter(run =>
      run.domain?.toLowerCase() === domain.toLowerCase() ||
      (domain === 'AI' && run.domain === 'Artificial Intelligence') // Handle aliasing if needed
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-yellow-400 cube-bg">
      <Navbar />

      <main className="flex-1 px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-black uppercase tracking-tighter">Laboratory</h1>
            <p className="text-xl font-medium text-slate-600 max-w-2xl mx-auto">
              Manage your scientific illustrations and comic generation pipelines.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Papers</h2>
              <Button variant="outline">Import New Paper</Button>
            </div>

            {/* EXISTING CARDS (Static Placeholder) */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* ... (Keeping existing static cards for now, or could replace) ... */}
              {/* For brevity, I'm keeping them as "Templates" or "Recent Manual Imports" */}
              <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                    <span className="text-xs font-mono text-slate-400">ArXiv:1706.03762</span>
                  </div>
                  <CardTitle className="mt-4 text-lg">Attention Is All You Need</CardTitle>
                  <CardDescription>Artificial Intelligence • Deep Learning</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    Proposing the Transformer architecture based solely on attention mechanisms.
                  </p>
                  <Link to="/editor?paper=paper-1">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800">
                      Open Editor <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="bg-slate-900/10" />

          {/* ANALYTICS SECTIONS */}
          <div className="space-y-12">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-slate-800" />
              <h2 className="text-3xl font-black uppercase tracking-tighter">Test Results by Domain</h2>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 animate-pulse">Loading analytics...</div>
            ) : (
              <div className="space-y-12">
                {RESEARCH_DOMAINS.map((domain) => {
                  const domainRuns = getRunsByDomain(domain);
                  if (domainRuns.length === 0) return null; // Hide empty sections

                  return (
                    <div key={domain} className="space-y-4">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-8 bg-slate-900 block rounded-full"></span>
                        {domain}
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {domainRuns.map((run) => (
                          <Card key={run.id} className="border-0 shadow-sm hover:shadow-md transition-all bg-white/50 backdrop-blur-sm">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                  {run.status === 'completed' ? (
                                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                                  ) : run.status === 'failed' ? (
                                    <XCircle className="text-red-500 w-5 h-5" />
                                  ) : (
                                    <Activity className="text-amber-500 w-5 h-5 animate-pulse" />
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    Score: {run.quality_score}%
                                  </Badge>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {new Date(run.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm line-clamp-1" title={run.source_title}>
                                  {run.source_title || 'Unknown Title'}
                                </h4>
                                <a href={run.source_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                                  {run.source_url}
                                </a>
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {(run.total_duration_ms / 1000).toFixed(1)}s
                                </span>

                                <div className="flex gap-3">
                                  {run.status === 'completed' && (
                                    <>
                                      <Link to={`/viewer?runId=${run.id}`} className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1">
                                        <FileText size={12} /> View Comic
                                      </Link>
                                      <Link to={`/studio/${run.id}`} className="font-bold text-slate-900 hover:text-pink-600 flex items-center gap-1">
                                        <Activity size={12} /> Open Studio
                                      </Link>
                                    </>
                                  )}
                                  <span className="hover:underline cursor-pointer">Details</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Laboratory;