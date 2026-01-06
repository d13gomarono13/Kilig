import { ComicManifest } from '../components/comic/types';
import { MANIFESTS } from '../components/comic/demo-data';

export interface Author {
  id: string;
  name: string;
  avatarUrl: string; // e.g., "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
  role: 'AI Agent' | 'Illustrator' | 'Researcher';
  reputation: number;
}

export interface FeedPost {
  id: string;
  type: 'comic' | 'video';
  title: string;
  abstract: string;
  field: 'Physics' | 'Biology' | 'CS' | 'Math' | 'Chemistry';
  author: Author;
  timestamp: string;
  likes: number;
  saves: number;
  manifest: ComicManifest; // The actual content to render in preview
  tags: string[];
}

// Reuse existing demo manifests for content
const aiAuthor: Author = {
  id: 'kilig-ai',
  name: 'Kilig AI (Root)',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kilig',
  role: 'AI Agent',
  reputation: 999
};

const humanAuthor: Author = {
  id: 'alice-human',
  name: 'Alice Illustrator',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
  role: 'Illustrator',
  reputation: 450
};

export const MOCK_FEED: FeedPost[] = [
  {
    id: 'post-1',
    type: 'comic',
    title: 'Attention Is All You Need',
    abstract: 'The paper that changed NLP forever. We visualize the Multi-Head Attention mechanism using a dynamic network graph template.',
    field: 'CS',
    author: aiAuthor,
    timestamp: '2h ago',
    likes: 1240,
    saves: 340,
    manifest: MANIFESTS['paper-1'],
    tags: ['Transformer', 'NLP', 'Deep Learning']
  },
  {
    id: 'post-2',
    type: 'comic',
    title: 'CRISPR-Cas9 Mechanism',
    abstract: 'A step-by-step breakdown of how the Cas9 protein unzips DNA and cuts at the target location.',
    field: 'Biology',
    author: humanAuthor,
    timestamp: '5h ago',
    likes: 856,
    saves: 120,
    manifest: MANIFESTS['paper-2'],
    tags: ['Genetics', 'Biotech', 'Protein Folding']
  },
  {
    id: 'post-3',
    type: 'comic',
    title: 'Gravitational Waves Discovery',
    abstract: 'Visualizing the strain caused by the merger of two black holes. See the chirp!',
    field: 'Physics',
    author: aiAuthor,
    timestamp: '1d ago',
    likes: 2100,
    saves: 890,
    manifest: MANIFESTS['paper-3'],
    tags: ['LIGO', 'Astrophysics', 'Black Holes']
  },
  {
    id: 'post-test',
    type: 'comic',
    title: 'The Physics of Coffee',
    abstract: 'Understanding thermodynamics and fluid dynamics in your morning cup. Optimized for 93°C.',
    field: 'Chemistry',
    author: humanAuthor,
    timestamp: '2d ago',
    likes: 543,
    saves: 50,
    manifest: MANIFESTS['paper-test'],
    tags: ['Thermodynamics', 'Coffee', 'Fluids']
  }
];
