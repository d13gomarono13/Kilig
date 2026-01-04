import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle, XCircle, Loader2, ArrowRight, FolderOpen, Activity } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button, Card, Input, Badge } from "@/components/retroui";
import { BarChart } from "@/components/retroui/charts/BarChart";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type ProjectStatus = "processing" | "done" | "failed";

interface Project {
  id: string;
  title: string;
  createdAt: Date;
  status: ProjectStatus;
}

// Demo projects
const demoProjects: Project[] = [
  {
    id: "1",
    title: "Quantum Computing Fundamentals",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: "done",
  },
  {
    id: "2",
    title: "Neural Network Architectures",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: "processing",
  },
  {
    id: "3",
    title: "Climate Change Models",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: "failed",
  },
];

const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "outline" | "secondary"; icon: typeof CheckCircle; color: string }> = {
  processing: { label: "Processing", variant: "default", icon: Loader2, color: "bg-neo-yellow" },
  done: { label: "Done", variant: "secondary", icon: CheckCircle, color: "bg-neo-green" },
  failed: { label: "Failed", variant: "outline", icon: XCircle, color: "bg-neo-red" },
};

const chartData = [
  { name: "Mon", total: 12 },
  { name: "Tue", total: 18 },
  { name: "Wed", total: 15 },
  { name: "Thu", total: 25 },
  { name: "Fri", total: 20 },
  { name: "Sat", total: 30 },
  { name: "Sun", total: 22 },
];

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectTopic, setNewProjectTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTopic.trim()) return;

    setIsCreating(true);
    
    // Simulate API call
    setTimeout(() => {
        const query = encodeURIComponent(newProjectTopic);
        navigate(`/studio/new?query=${query}`);
    }, 1000);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 px-4 py-12 diamond-bg">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header & Stats */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-4 border-black p-6 shadow-md">
                    <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight">Your Projects</h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Manage your video generation pipelines
                    </p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="shadow-md">
                    <Plus className="w-5 h-5 mr-2" />
                    New Project
                    </Button>
                </div>

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <Card className="text-center py-20 bg-white border-4 border-black border-dashed">
                    <Card.Content>
                        <FolderOpen className="w-20 h-20 mx-auto mb-6 text-muted-foreground/50" />
                        <h3 className="text-2xl font-bold mb-2 uppercase">No Projects Yet</h3>
                        <p className="text-muted-foreground font-medium mb-8">
                        Create your first project to get started
                        </p>
                        <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Project
                        </Button>
                    </Card.Content>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                    {projects.map((project) => {
                        const status = statusConfig[project.status];
                        const StatusIcon = status.icon;
                        
                        return (
                        <Card key={project.id} className="flex flex-col bg-white hover-lift border-4 border-black shadow-md">
                            <Card.Header className="pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <Card.Title className="text-xl font-bold leading-tight line-clamp-2">
                                {project.title}
                                </Card.Title>
                                <Badge className={`${status.color} text-black border-2 border-black`}>
                                <StatusIcon className={`w-3 h-3 mr-1 ${project.status === 'processing' ? 'animate-spin' : ''}`} />
                                {status.label}
                                </Badge>
                            </div>
                            </Card.Header>
                            <Card.Content className="flex-1 py-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-gray-100 w-fit px-3 py-1 border-2 border-black/10 rounded-full">
                                <Clock className="w-4 h-4" />
                                {formatDate(project.createdAt)}
                            </div>
                            </Card.Content>
                            <div className="p-4 pt-0 mt-auto">
                            <Button 
                                variant="outline" 
                                className="w-full justify-between group bg-white hover:bg-neo-yellow/20"
                                onClick={() => navigate(`/studio/${project.id}`)}
                            >
                                {project.status === "processing" ? "View Progress" : "Edit Studio"}
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                            </div>
                        </Card>
                        );
                    })}
                    </div>
                )}
            </div>

            {/* Sidebar / Stats */}
            <div className="space-y-6">
                <Card className="bg-white border-4 border-black shadow-lg">
                    <Card.Header className="border-b-4 border-black bg-neo-purple/20">
                        <Card.Title className="flex items-center gap-2 uppercase">
                            <Activity className="w-5 h-5" />
                            System Activity
                        </Card.Title>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <div className="h-[200px] w-full">
                            <BarChart 
                                data={chartData} 
                                categories={["total"]} 
                                index="name" 
                                colors={["var(--color-neo-blue)"]}
                                valueFormatter={(number) => `${number} gens`}
                                yAxisWidth={40}
                            />
                        </div>
                        <div className="mt-6 space-y-4">
                            <div className="flex justify-between items-center border-b-2 border-dashed border-black/20 pb-2">
                                <span className="font-bold">Total Generations</span>
                                <span className="font-black text-xl">142</span>
                            </div>
                            <div className="flex justify-between items-center border-b-2 border-dashed border-black/20 pb-2">
                                <span className="font-bold">Avg. Time</span>
                                <span className="font-black text-xl">45s</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Success Rate</span>
                                <span className="font-black text-xl text-neo-green">98.5%</span>
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                <div className="bg-neo-yellow border-4 border-black p-6 shadow-md transform rotate-1 hover:rotate-0 transition-transform cursor-default">
                    <h3 className="text-2xl font-black uppercase mb-2">Pro Tip</h3>
                    <p className="font-medium border-l-4 border-black pl-4">
                        Use specific scientific keywords for better scene generation. The Scientist agent loves jargon!
                    </p>
                </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* New Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border-4 border-black shadow-xl max-w-lg p-0 overflow-hidden gap-0 bg-white">
          <DialogHeader className="p-6 bg-neo-blue/20 border-b-4 border-black">
            <DialogTitle className="text-3xl font-black uppercase">New Project</DialogTitle>
            <DialogDescription className="text-black font-medium opacity-80">
              Enter a paper topic or paste a URL to start the AI pipeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="p-6">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-wider">Topic / URL</label>
              <Input
                value={newProjectTopic}
                onChange={(e) => setNewProjectTopic(e.target.value)}
                placeholder="e.g., 'The effects of climate change on coral reefs'"
                className="h-14 border-4 border-black shadow-sm text-lg font-medium focus:shadow-none transition-shadow"
                disabled={isCreating}
                autoFocus
              />
            </div>
            <DialogFooter className="mt-8 gap-3 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
                className="border-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!newProjectTopic.trim() || isCreating}
                className="w-full sm:w-auto"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    Launch Pipeline
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}