import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle, XCircle, Loader2, ArrowRight, FolderOpen } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const statusConfig: Record<ProjectStatus, { label: string; variant: "neoGreen" | "neo" | "neoRed"; icon: typeof CheckCircle }> = {
  processing: { label: "Processing", variant: "neo", icon: Loader2 },
  done: { label: "Done", variant: "neoGreen", icon: CheckCircle },
  failed: { label: "Failed", variant: "neoRed", icon: XCircle },
};

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
    
    // In a real app, we might create the project record first, 
    // but here we let the Studio handle the pipeline trigger
    const query = encodeURIComponent(newProjectTopic);
    navigate(`/studio/new?query=${query}`);
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Your Projects</h1>
              <p className="text-muted-foreground mt-1">
                Manage your video generation pipelines
              </p>
            </div>
            <Button variant="neo" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <Card variant="elevated" className="text-center py-16">
              <CardContent>
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first project to get started
                </p>
                <Button variant="neo" onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const status = statusConfig[project.status];
                const StatusIcon = status.icon;
                
                return (
                  <Card key={project.id} variant="elevated" className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg leading-tight">
                          {project.title}
                        </CardTitle>
                        <Badge variant={status.variant} className="shrink-0">
                          <StatusIcon className={`w-3 h-3 mr-1 ${project.status === 'processing' ? 'animate-spin' : ''}`} />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {formatDate(project.createdAt)}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => navigate(`/studio/${project.id}`)}
                      >
                        {project.status === "processing" ? "View Progress" : "Edit Studio"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border-2 border-foreground shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">New Project</DialogTitle>
            <DialogDescription>
              Enter a paper topic or paste a URL to start the AI pipeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="py-4">
              <Input
                value={newProjectTopic}
                onChange={(e) => setNewProjectTopic(e.target.value)}
                placeholder="e.g., 'The effects of climate change on coral reefs'"
                className="h-12 border-2 border-foreground shadow-xs"
                disabled={isCreating}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="neo"
                disabled={!newProjectTopic.trim() || isCreating}
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
