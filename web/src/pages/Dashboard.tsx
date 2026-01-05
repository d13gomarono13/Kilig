import { useState } from "react";
import { 
  Plus, 
  Clock, 
  Check, 
  CalendarDays, 
  LoaderCircle, 
  MapPin, 
  StarIcon, 
  Ticket, 
  CircleArrowRight 
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button, Card, Badge, Text, Input } from "@/components/retroui";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface Project {
  id: string;
  title: string;
  createdAt: Date;
  location: string;
  price: number;
  description: string;
  status: "waiting" | "done" | "expired";
  queuePosition?: number;
}

// Redesigned static projects
const demoProjects: Project[] = [
  {
    id: "1",
    title: "Paper 1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    location: "Kilig Cloud Server A",
    price: 49.00,
    description: "Deep dive into the architectural patterns of modern autonomous agent systems.",
    status: "done",
  },
  {
    id: "2",
    title: "Paper 2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    location: "Kilig Cloud Server B",
    price: 29.00,
    description: "Analyzing the efficiency of OKLCH color spaces in neo-brutalist web design.",
    status: "waiting",
    queuePosition: 2,
  },
  {
    id: "3",
    title: "Paper 3",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    location: "Local Instance",
    price: 99.00,
    description: "Comparative study of React 18 vs React 19 concurrent rendering pipelines.",
    status: "expired",
  },
];

// Re-implementing the visual logic of the provided EventCard
const RedesignedProjectCard = ({ project }: { project: Project }) => {
    const isPastEvent = project.status === "expired";
    const isEventOwner = true; // For visual demo
    const imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

    const renderQueuePosition = () => {
        if (project.status !== "waiting" || !project.queuePosition) return null;

        if (project.queuePosition === 2) {
            return (
                <div className="flex flex-col lg:flex-row items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 mt-4">
                    <div className="flex items-center">
                        <CircleArrowRight className="w-5 h-5 text-amber-500 mr-2" />
                        <span className="text-amber-700 font-medium">
                            Next in line! (Queue: {project.queuePosition})
                        </span>
                    </div>
                    <div className="flex items-center">
                        <LoaderCircle className="w-4 h-4 mr-1 animate-spin text-amber-500" />
                        <span className="text-amber-600 text-sm">Processing...</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                <div className="flex items-center">
                    <LoaderCircle className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                    <span className="text-blue-700">Queue position</span>
                </div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                    #{project.queuePosition}
                </span>
            </div>
        )
    };

    const renderTicketStatus = () => {
        if (project.status === "done") {
            return (
                <div className="mt-4 flex items-center justify-between p-3 rounded-lg border-2 border-neo-green">
                    <div className="flex items-center">
                        <Check className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-700 font-medium">
                            Analysis Complete!
                        </span>
                    </div>
                </div>
            );
        }

        if (project.status === "expired") {
            return (
                <div className="mt-4 p-3 bg-red-100 rounded-lg border-2 border-red-200">
                    <span className="text-red-700 font-medium flex items-center">
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        Session Expired
                    </span>
                </div>
            );
        }

        return renderQueuePosition();
    }

    return (
        <Card className={`rounded-xl pt-0 overflow-hidden transition-all duration-200 relative bg-white border-4 border-black shadow-md ${isPastEvent ? "opacity-75" : ""}`}>
            {/* Project Image */}
            <div className="relative w-full h-48 border-b-4 border-black">
                <img
                    src={imageUrl}
                    alt={project.title}
                    className='w-full h-full object-cover'
                />
            </div>

            {/* Project Details */}
            <div className="p-6">
                <div>
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-black uppercase italic">{project.title}</h2>
                            <div className="flex flex-row gap-2 mt-2">
                                {isEventOwner && (
                                    <Badge className="bg-neo-yellow text-black border-2 border-black font-bold">
                                        <StarIcon className="w-3 h-3 mr-1 fill-black" />
                                        Primary
                                    </Badge>
                                )}
                                {isPastEvent && (
                                    <Badge className="bg-gray-200 text-gray-600 border-2 border-gray-400 font-bold">
                                        Archived
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-black/70 text-sm font-medium line-clamp-2 italic">
                    {project.description}
                </p>

                {renderTicketStatus()}
            </div>
        </Card>
    )
}

function XCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectTopic, setNewProjectTopic] = useState("");
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 px-4 py-12 diamond-bg">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-4 border-black p-6 shadow-md">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tight">Your Papers</h1>
              <p className="text-muted-foreground font-medium mt-1">
                View your archived generation history
              </p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="shadow-md">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </div>

          {/* Projects Grid - Now Unclickable and using the new design */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {demoProjects.map((project) => (
              <RedesignedProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border-4 border-black shadow-xl max-w-lg p-0 overflow-hidden gap-0 bg-white">
          <DialogHeader className="p-6 bg-neo-blue/20 border-b-4 border-black">
            <DialogTitle className="text-3xl font-black uppercase">New Project</DialogTitle>
            <DialogDescription className="text-black font-medium opacity-80">
              Enter a paper topic to start the pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Input
              value={newProjectTopic}
              onChange={(e) => setNewProjectTopic(e.target.value)}
              placeholder="e.g., 'Quantum computing basics'"
              className="h-14 border-4 border-black shadow-sm text-lg font-medium"
            />
            <DialogFooter className="mt-8">
              <Button onClick={() => setIsModalOpen(false)}>Launch Pipeline</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
