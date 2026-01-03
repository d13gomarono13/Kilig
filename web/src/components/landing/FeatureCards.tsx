import { Bot, Play, FileText, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Bot,
    title: "Autonomous Agents",
    description: "Three specialized AI agents work in harmony: Scientist analyzes, Narrative Architect scripts, Designer visualizes.",
    variant: "neo" as const,
  },
  {
    icon: Play,
    title: "Revideo Engine",
    description: "Programmatic animation powered by pure TypeScript. No After Effects needed—just data-driven visuals.",
    variant: "neoBlue" as const,
  },
  {
    icon: FileText,
    title: "Paper to Script",
    description: "Upload any scientific paper and watch as our AI extracts key insights and crafts engaging narratives.",
    variant: "neoPink" as const,
  },
  {
    icon: Wand2,
    title: "Real-time Preview",
    description: "See your video come to life as the SceneGraph generates. Tweak styles and watch changes instantly.",
    variant: "neoGreen" as const,
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The Pipeline
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A seamless workflow from scientific research to stunning video, 
            powered by cutting-edge AI and programmatic animation.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              variant={feature.variant}
              className="hover-lift cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-card border-2 border-foreground shadow-xs flex items-center justify-center">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow visualization */}
        <div className="mt-16 p-8 bg-card border-2 border-foreground shadow-md">
          <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-neo-yellow border-2 border-foreground shadow-sm flex items-center justify-center mb-3">
                <span className="text-2xl font-bold">1</span>
              </div>
              <span className="font-bold uppercase text-sm">Input Paper</span>
            </div>
            <div className="hidden md:block text-4xl">→</div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-neo-blue border-2 border-foreground shadow-sm flex items-center justify-center mb-3">
                <span className="text-2xl font-bold">2</span>
              </div>
              <span className="font-bold uppercase text-sm">AI Analysis</span>
            </div>
            <div className="hidden md:block text-4xl">→</div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-neo-purple border-2 border-foreground shadow-sm flex items-center justify-center mb-3">
                <span className="text-2xl font-bold">3</span>
              </div>
              <span className="font-bold uppercase text-sm">Script Gen</span>
            </div>
            <div className="hidden md:block text-4xl">→</div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-neo-green border-2 border-foreground shadow-sm flex items-center justify-center mb-3">
                <span className="text-2xl font-bold">4</span>
              </div>
              <span className="font-bold uppercase text-sm">Video Output</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
