import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, FileText, FlaskConical, Atom } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const Laboratory = () => {
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
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* PAPER 1: AI */}
            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="text-blue-600" size={24}/>
                  </div>
                  <span className="text-xs font-mono text-slate-400">ArXiv:1706.03762</span>
                </div>
                <CardTitle className="mt-4 text-lg">Attention Is All You Need</CardTitle>
                <CardDescription>Artificial Intelligence • Deep Learning</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  Proposing the Transformer architecture based solely on attention mechanisms, replacing RNNs.
                </p>
                <Link to="/workbench?paper=paper-1">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800">
                    Open Workbench <ArrowRight size={16} className="ml-2"/>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* PAPER 2: BIOLOGY */}
            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-green-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FlaskConical className="text-green-600" size={24}/>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Science:337</span>
                </div>
                <CardTitle className="mt-4 text-lg">CRISPR-Cas9 Editing</CardTitle>
                <CardDescription>Biology • Genetics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity.
                </p>
                <Link to="/workbench?paper=paper-2">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800">
                    Open Workbench <ArrowRight size={16} className="ml-2"/>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* PAPER 3: PHYSICS */}
            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Atom className="text-purple-600" size={24}/>
                  </div>
                  <span className="text-xs font-mono text-slate-400">PRL:116</span>
                </div>
                <CardTitle className="mt-4 text-lg">Gravitational Waves</CardTitle>
                <CardDescription>Physics • Astrophysics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  Observation of Gravitational Waves from a Binary Black Hole Merger by LIGO.
                </p>
                <Link to="/workbench?paper=paper-3">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800">
                    Open Workbench <ArrowRight size={16} className="ml-2"/>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* TEST PAPER: COFFEE */}
            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-amber-500 bg-amber-50/30">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <FlaskConical className="text-amber-600" size={24}/>
                  </div>
                  <span className="text-xs font-mono text-slate-400">TEST-001</span>
                </div>
                <CardTitle className="mt-4 text-lg">The Physics of Coffee</CardTitle>
                <CardDescription>Kitchen Science • Thermodynamics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  A simple test case to demonstrate the Vivacious Panel Engine with Revideo integration.
                </p>
                <Link to="/workbench?paper=paper-test">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    Run Test Workbench <ArrowRight size={16} className="ml-2"/>
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
};

export default Laboratory;