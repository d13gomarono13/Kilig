import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  Bot, 
  Brain, 
  Palette, 
  Play, 
  Pause,
  FileText,
  Code,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { runPipeline, AgentType, LogEntry, LogLevel } from "@/lib/pipeline";
import { Player } from "@revideo/player-react";

const agentConfig: Record<AgentType, { name: string; icon: any; color: string }> = {
  scientist: { name: "Scientist", icon: Brain, color: "bg-neo-blue" },
  narrative_architect: { name: "Narrative Architect", icon: FileText, color: "bg-neo-purple" },
  designer: { name: "Designer", icon: Palette, color: "bg-neo-pink" },
  root: { name: "Orchestrator", icon: Bot, color: "bg-neo-yellow" },
};

export default function Studio() {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get("query");

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTab, setCurrentTab] = useState("logs");
  const [progress, setProgress] = useState(0);
  
  const [analysis, setAnalysis] = useState<string>("");
  const [script, setScript] = useState<string>("");
  const [sceneGraph, setSceneGraph] = useState<any>(null);
  const [realProjectId, setRealProjectId] = useState<string | null>(null);

  // Trigger real pipeline
  useEffect(() => {
    if (!initialQuery) return;

    const stopPipeline = runPipeline({
      query: initialQuery,
      onEvent: (event) => {
        if (event.type === 'project_created') {
          setRealProjectId(event.projectId || null);
        } else if (event.type === 'agent_event') {
          if (event.author) setActiveAgent(event.author);
          
          setLogs(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            timestamp: event.timestamp || new Date().toISOString(),
            agent: event.author,
            level: 'agent',
            message: event.text || (event.toolCalls ? `Calling tools: ${event.toolCalls.map(t => t.function.name).join(', ')}` : '')
          }]);
        } else if (event.type === 'artifact_updated') {
          if (event.artifactType === 'analysis') setAnalysis(event.content || "");
          if (event.artifactType === 'script') setScript(event.content || "");
          if (event.artifactType === 'scenegraph') {
            try {
              const parsed = JSON.parse(event.content || "{}");
              setSceneGraph(parsed);
            } catch (e) {
              setSceneGraph(event.content);
            }
          }
        } else if (event.type === 'error') {
          setLogs(prev => [...prev, {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level: 'error',
            message: event.message || "An unknown error occurred"
          }]);
        }
      },
      onError: (err) => {
        setLogs(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: 'error',
          message: err.message || "Connection error"
        }]);
      },
      onDone: () => {
        setActiveAgent(null);
        setProgress(100);
      }
    });

    return () => stopPipeline();
  }, [initialQuery]);

  // Update progress based on artifacts
  useEffect(() => {
    let p = 0;
    if (analysis) p += 30;
    if (script) p += 30;
    if (sceneGraph) p += 40;
    setProgress(p);
  }, [analysis, script, sceneGraph]);


  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b-2 border-foreground px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-bold">Project Studio</h1>
              <p className="text-sm text-muted-foreground font-mono">ID: {realProjectId || id}</p>
            </div>
          </div>

          {/* Agent Status */}
          <div className="flex items-center gap-3">
            {Object.entries(agentConfig).map(([key, agent]) => {
              const isActive = activeAgent === key;
              const AgentIcon = agent.icon;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-foreground transition-all ${
                    isActive ? `${agent.color} shadow-sm` : "bg-muted"
                  }`}
                >
                  <AgentIcon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                  <span className="text-xs font-bold uppercase hidden sm:inline">
                    {agent.name}
                  </span>
                  {isActive && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-muted border-2 border-foreground">
          <div
            className="h-full bg-neo-green transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Content - Three Pane Layout */}
      <main className="flex-1 grid lg:grid-cols-3 divide-x-2 divide-foreground">
        {/* Left Panel: Agent Workspace */}
        <div className="flex flex-col">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b-2 border-foreground bg-muted p-0 h-auto">
              <TabsTrigger
                value="logs"
                className="rounded-none border-r-2 border-foreground px-4 py-3 font-bold uppercase text-xs data-[state=active]:bg-neo-yellow data-[state=active]:shadow-none"
              >
                <Bot className="w-4 h-4 mr-2" />
                Agent Logs
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className="rounded-none border-r-2 border-foreground px-4 py-3 font-bold uppercase text-xs data-[state=active]:bg-neo-blue data-[state=active]:shadow-none"
              >
                <Brain className="w-4 h-4 mr-2" />
                Analysis
              </TabsTrigger>
              <TabsTrigger
                value="script"
                className="rounded-none px-4 py-3 font-bold uppercase text-xs data-[state=active]:bg-neo-purple data-[state=active]:shadow-none"
              >
                <FileText className="w-4 h-4 mr-2" />
                Script
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="flex-1 mt-0 p-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="p-4 space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 border-2 border-foreground text-sm ${
                        log.level === "error"
                          ? "bg-neo-red"
                          : log.level === "success"
                          ? "bg-neo-green"
                          : log.agent
                          ? agentConfig[log.agent as AgentType]?.color
                          : "bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatTime(log.timestamp)}
                        </span>
                        {log.agent && (
                          <Badge variant="outline" className="text-xs">
                            {agentConfig[log.agent as AgentType]?.name}
                          </Badge>
                        )}
                        {log.level === "success" && <CheckCircle className="w-4 h-4" />}
                        {log.level === "error" && <AlertCircle className="w-4 h-4" />}
                      </div>
                      <p>{log.message}</p>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p>Initializing pipeline...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analysis" className="flex-1 mt-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="p-4">
                  <pre className="font-mono text-sm whitespace-pre-wrap bg-card border-2 border-foreground p-4 shadow-xs">
                    {analysis || "Waiting for scientist to complete analysis..."}
                  </pre>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="script" className="flex-1 mt-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="p-4">
                  <pre className="font-mono text-sm whitespace-pre-wrap bg-card border-2 border-foreground p-4 shadow-xs">
                    {script || "Waiting for narrative architect to generate script..."}
                  </pre>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center Panel: Canvas */}
        <div className="flex flex-col">
          <div className="p-4 border-b-2 border-foreground bg-muted">
            <h2 className="font-bold uppercase text-sm flex items-center gap-2">
              <Play className="w-4 h-4" />
              Video Preview
            </h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 bg-foreground/5">
             <Card variant="elevated" className="w-full aspect-video flex items-center justify-center bg-foreground text-background overflow-hidden relative">
                {sceneGraph ? (
                   <Player
                     component={() => null} // We'll need to define a real Revideo component later
                     durationInFrames={300}
                     compositionWidth={1920}
                     compositionHeight={1080}
                     fps={30}
                     inputProps={{ sceneGraph }}
                     style={{ width: '100%', height: '100%' }}
                     controls
                   />
                ) : (
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-background" />
                    <p className="text-lg font-bold uppercase">Generating Canvas</p>
                    <p className="text-sm text-background/70 mt-1">
                      Designer is working on the SceneGraph...
                    </p>
                  </div>
                )}
             </Card>
          </div>
        </div>

        {/* Right Panel: Inspector */}
        <div className="flex flex-col">
          <div className="p-4 border-b-2 border-foreground bg-muted">
            <h2 className="font-bold uppercase text-sm flex items-center gap-2">
              <Code className="w-4 h-4" />
              SceneGraph Inspector
            </h2>
          </div>
          <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
            <div className="p-4">
              <pre className="font-mono text-xs whitespace-pre-wrap bg-card border-2 border-foreground p-4 shadow-xs overflow-x-auto">
                {sceneGraph ? JSON.stringify(sceneGraph, null, 2) : "Waiting for SceneGraph..."}
              </pre>


              {/* Visualization Hints */}
              <div className="mt-6 space-y-4">
                <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Design Rationale
                </h3>
                <Card variant="neo" className="text-sm">
                  <CardContent className="p-4">
                    <p className="font-bold mb-1">Scene 1: Intro</p>
                    <p className="text-foreground/80">
                      Large typography with fade-in creates immediate impact and establishes the topic.
                    </p>
                  </CardContent>
                </Card>
                <Card variant="neoBlue" className="text-sm">
                  <CardContent className="p-4">
                    <p className="font-bold mb-1">Scene 2: Superposition</p>
                    <p className="text-foreground/80">
                      Wave animation visually represents the probabilistic nature of quantum states.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
