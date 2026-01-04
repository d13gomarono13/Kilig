import { Bot, Play, FileText, Wand2, ArrowRight } from "lucide-react";
import { Card } from "@/components/retroui";

const features = [
  {
    icon: Bot,
    title: "Autonomous Agents",
    description: "Three specialized AI agents work in harmony: Scientist analyzes, Narrative Architect scripts, Designer visualizes.",
    color: "bg-neo-yellow",
  },
  {
    icon: Play,
    title: "Revideo Engine",
    description: "Programmatic animation powered by pure TypeScript. No After Effects needed—just data-driven visuals.",
    color: "bg-neo-blue",
  },
  {
    icon: FileText,
    title: "Paper to Script",
    description: "Upload any scientific paper and watch as our AI extracts key insights and crafts engaging narratives.",
    color: "bg-neo-pink",
  },
  {
    icon: Wand2,
    title: "Real-time Preview",
    description: "See your video come to life as the SceneGraph generates. Tweak styles and watch changes instantly.",
    color: "bg-neo-green",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="py-24 px-4 diamond-bg border-b-4 border-black">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 uppercase tracking-tighter">
            The <span className="text-outlined text-neo-blue">Pipeline</span>
          </h2>
          <p className="text-xl text-foreground font-medium max-w-2xl mx-auto">
            A seamless workflow from scientific research to stunning video, 
            powered by cutting-edge AI and programmatic animation.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="hover-lift cursor-pointer bg-white border-4 border-black shadow-lg"
            >
              <Card.Header>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 ${feature.color} border-4 border-black shadow-sm flex items-center justify-center`}>
                    <feature.icon className="w-8 h-8 text-black" />
                  </div>
                  <Card.Title className="text-2xl uppercase tracking-tight">{feature.title}</Card.Title>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-lg font-medium leading-relaxed">{feature.description}</p>
              </Card.Content>
            </Card>
          ))}
        </div>

        {/* Workflow visualization */}
        <div className="mt-20 p-10 bg-white border-4 border-black shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neo-yellow/10 -mr-16 -mt-16 rotate-45 border-4 border-black" />
          
          <h3 className="text-3xl font-bold text-center mb-12 uppercase tracking-widest">How It Works</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-neo-yellow border-4 border-black shadow-md flex items-center justify-center mb-4 hover-lift">
                <span className="text-3xl font-bold">1</span>
              </div>
              <span className="font-bold uppercase tracking-wider text-sm bg-black text-white px-3 py-1">Input Paper</span>
            </div>
            <div className="hidden md:block">
              <ArrowRight className="w-10 h-10" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-neo-blue border-4 border-black shadow-md flex items-center justify-center mb-4 hover-lift">
                <span className="text-3xl font-bold">2</span>
              </div>
              <span className="font-bold uppercase tracking-wider text-sm bg-black text-white px-3 py-1">AI Analysis</span>
            </div>
            <div className="hidden md:block">
              <ArrowRight className="w-10 h-10" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-neo-purple border-4 border-black shadow-md flex items-center justify-center mb-4 hover-lift">
                <span className="text-3xl font-bold">3</span>
              </div>
              <span className="font-bold uppercase tracking-wider text-sm bg-black text-white px-3 py-1">Script Gen</span>
            </div>
            <div className="hidden md:block">
              <ArrowRight className="w-10 h-10" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-neo-green border-4 border-black shadow-md flex items-center justify-center mb-4 hover-lift">
                <span className="text-3xl font-bold">4</span>
              </div>
              <span className="font-bold uppercase tracking-wider text-sm bg-black text-white px-3 py-1">Video Output</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}