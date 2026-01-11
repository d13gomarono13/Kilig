import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Brain,
  Palette,
  Play,
  FileText,
  Code,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Button, Card, Badge, Tabs, TabsPanels, TabsTrigger, TabsContent, TabsTriggerList } from "@/components/retroui";
import { ScrollArea } from "@/components/ui/scroll-area";
import { runPipeline, AgentType, LogEntry } from "@/lib/pipeline";
import { Player } from "@revideo/player-react";
import DynamicScene from "@/components/video/DynamicScene";
import { useProject } from "@/hooks/use-project";

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

  // Fetch existing project if ID is present
  const { data: projectData } = useProject(id);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [progress, setProgress] = useState(0);

  const [analysis, setAnalysis] = useState<string>("");
  const [script, setScript] = useState<string>("");
  const [sceneGraph, setSceneGraph] = useState<any>(null);
  const [realProjectId, setRealProjectId] = useState<string | null>(null);

  // Hydrate state from fetched project
  useEffect(() => {
    if (projectData) {
      if (projectData.research_summary) setAnalysis(projectData.research_summary);
      if (projectData.script) setScript(projectData.script);
      if (projectData.scenegraph) setSceneGraph(projectData.scenegraph);
      setRealProjectId(projectData.id);

      // If completed, set progress to 100
      if (projectData.status === 'completed') setProgress(100);
    }
  }, [projectData]);

  // Trigger real pipeline (only if fresh query)
  useEffect(() => {
    // Only run pipeline if we have a query AND we haven't loaded an existing project yet
    if (!initialQuery || projectData) return;

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
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button size="icon" asChild className="border-2 w-10 h-10">
              <Link to="/laboratory">
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </Button>
            <div>
              <h1 className="font-black uppercase text-xl tracking-tight">Project Studio</h1>
              <p className="text-xs text-muted-foreground font-mono font-bold">ID: {realProjectId || id}</p>
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
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-black transition-all ${isActive ? `${agent.color} shadow-sm translate-y-[-2px]` : "bg-gray-100 opacity-50"
                    }`}
                >
                  <AgentIcon className={`w-4 h-4 ${isActive ? "animate-bounce" : ""}`} />
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
        <div className="mt-3 h-3 bg-gray-200 border-2 border-black relative overflow-hidden">
          <div
            className="h-full bg-neo-green transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Striped overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]" />
        </div>
      </header>

      {/* Main Content - Three Pane Layout */}
      <main className="flex-1 grid lg:grid-cols-3 divide-x-4 divide-black h-[calc(100vh-80px)]">
        {/* Left Panel: Agent Workspace */}
        <div className="flex flex-col bg-white">
          <Tabs className="flex-1 flex flex-col h-full">
            <TabsTriggerList className="w-full justify-start border-b-4 border-black bg-gray-50 p-0 space-x-0">
              <TabsTrigger
                className="rounded-none border-r-4 border-b-0 border-transparent border-r-black px-6 py-3 font-black uppercase text-xs data-selected:bg-neo-yellow data-selected:border-black hover:bg-gray-200 transition-colors"
              >
                <Bot className="w-4 h-4 mr-2 inline-block" />
                Logs
              </TabsTrigger>
              <TabsTrigger
                className="rounded-none border-r-4 border-b-0 border-transparent border-r-black px-6 py-3 font-black uppercase text-xs data-selected:bg-neo-blue data-selected:border-black hover:bg-gray-200 transition-colors"
              >
                <Brain className="w-4 h-4 mr-2 inline-block" />
                Analysis
              </TabsTrigger>
              <TabsTrigger
                className="rounded-none border-b-0 border-transparent px-6 py-3 font-black uppercase text-xs data-selected:bg-neo-purple data-selected:border-black hover:bg-gray-200 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2 inline-block" />
                Script
              </TabsTrigger>
            </TabsTriggerList>

            <TabsPanels className="flex-1 overflow-hidden p-0">
              <TabsContent className="h-full p-0 border-0 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 border-2 border-black text-sm shadow-sm ${log.level === "error"
                          ? "bg-neo-red text-white"
                          : log.level === "success"
                            ? "bg-neo-green"
                            : log.agent
                              ? agentConfig[log.agent as AgentType]?.color
                              : "bg-white"
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1 border-b-2 border-black/10 pb-1">
                          <span className="font-mono text-xs font-bold opacity-70">
                            {formatTime(log.timestamp)}
                          </span>
                          {log.agent && (
                            <Badge className="text-[10px] bg-white text-black border border-black h-5">
                              {agentConfig[log.agent as AgentType]?.name}
                            </Badge>
                          )}
                          {log.level === "success" && <CheckCircle className="w-4 h-4" />}
                          {log.level === "error" && <AlertCircle className="w-4 h-4" />}
                        </div>
                        <p className="font-medium">{log.message}</p>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                        <Loader2 className="w-10 h-10 mb-4 animate-spin text-black" />
                        <p className="font-bold uppercase tracking-widest">Initializing pipeline...</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent className="h-full p-0 border-0 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <pre className="font-mono text-sm whitespace-pre-wrap bg-white border-4 border-black p-6 shadow-md">
                      {analysis || "Waiting for scientist to complete analysis..."}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent className="h-full p-0 border-0 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <pre className="font-mono text-sm whitespace-pre-wrap bg-white border-4 border-black p-6 shadow-md">
                      {script || "Waiting for narrative architect to generate script..."}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>
            </TabsPanels>
          </Tabs>
        </div>

        {/* Center Panel: Canvas */}
        <div className="flex flex-col bg-gray-100 diamond-bg">
          <div className="p-4 border-b-4 border-black bg-white">
            <h2 className="font-black uppercase text-sm flex items-center gap-2 tracking-widest">
              <Play className="w-4 h-4 fill-black" />
              Video Preview
            </h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full aspect-video flex items-center justify-center bg-black text-white overflow-hidden relative border-8 border-black shadow-xl">
              {sceneGraph || true ? (
                // Placeholder for Player (requires server)
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center border-4 border-dashed border-gray-700">
                  <div className="bg-neo-pink p-3 rounded-full mb-4">
                    <Play className="w-8 h-8 text-black ml-1" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Video Preview Unavailable</h3>
                  <p className="max-w-md text-sm text-gray-400">
                    The ReVideo Player requires a running project server URL.
                    <br />
                    <span className="font-mono text-xs bg-black/50 p-1 mt-2 inline-block rounded">
                      src="http://localhost:4000/player"
                    </span>
                  </p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-neo-green border-4 border-white shadow-[8px_8px_0px_white] flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Loader2 className="w-10 h-10 animate-spin text-black" />
                  </div>
                  <p className="text-2xl font-black uppercase tracking-widest">Generating Canvas</p>
                  <p className="text-sm text-white/70 mt-2 font-mono">
                    Designer is working on the SceneGraph...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Inspector */}
        <div className="flex flex-col bg-white">
          <div className="p-4 border-b-4 border-black bg-gray-50">
            <h2 className="font-black uppercase text-sm flex items-center gap-2 tracking-widest">
              <Code className="w-4 h-4" />
              SceneGraph Inspector
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              <div className="bg-gray-900 text-green-400 p-4 border-4 border-black shadow-md font-mono text-xs overflow-x-auto min-h-[200px]">
                {sceneGraph ? JSON.stringify(sceneGraph, null, 2) : "// Waiting for SceneGraph JSON..."}
              </div>

              {/* Visualization Hints */}
              <div className="space-y-4">
                <h3 className="font-black text-sm uppercase flex items-center gap-2 border-b-2 border-black pb-2">
                  <ChevronRight className="w-4 h-4" />
                  Design Rationale
                </h3>
                <Card className="text-sm bg-neo-yellow/20 border-2 border-black">
                  <Card.Content className="p-4">
                    <p className="font-bold mb-1 uppercase text-xs tracking-wider bg-black text-white w-fit px-2">Scene 1: Intro</p>
                    <p className="text-foreground/80 mt-2 font-medium">
                      Large typography with fade-in creates immediate impact and establishes the topic.
                    </p>
                  </Card.Content>
                </Card>
                <Card className="text-sm bg-neo-blue/20 border-2 border-black">
                  <Card.Content className="p-4">
                    <p className="font-bold mb-1 uppercase text-xs tracking-wider bg-black text-white w-fit px-2">Scene 2: Superposition</p>
                    <p className="text-foreground/80 mt-2 font-medium">
                      Wave animation visually represents the probabilistic nature of quantum states.
                    </p>
                  </Card.Content>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}