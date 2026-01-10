import { FeedPost, MOCK_FEED } from './feed-data';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  institution: string;
  bio: string;
  avatarUrl: string;
  stats: {
    reputation: number;
    works: number;
    followers: number;
    following: number;
  };
  posts: FeedPost[];
  saved: FeedPost[];
  drafts: FeedPost[];
}

export const MOCK_PROFILE: UserProfile = {
  id: 'u-1',
  name: 'Diego Marono',
  role: 'Lead Researcher',
  institution: 'Kilig Institute',
  bio: 'Exploring the intersection of AI agents and scientific communication. Building the future of research visualization.',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego',
  stats: {
    reputation: 1250,
    works: 12,
    followers: 340,
    following: 45
  },
  posts: MOCK_FEED.slice(0, 2), // First 2 posts
  saved: MOCK_FEED.slice(2, 4), // Last 2 posts
  drafts: [
    {
      ...MOCK_FEED[0],
      id: 'draft-1',
      title: 'Quantum Entanglement (Draft)',
      abstract: 'Work in progress: Visualizing spooky action at a distance.',
      timestamp: 'Edited 10m ago'
    }
  ]
};
