import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FeedPost, MOCK_FEED, Author } from '../data/feed-data';
import { ComicManifest } from '../components/comic/types';

// Database types (simplified)
interface DBPost {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  abstract: string;
  field: string;
  image_url: string;
  manifest_json: any;
  likes_count: number;
  saves_count: number;
  tags: string[] | null;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
    field_of_study: string;
  } | null; // Joined profile
}

export const useFeed = (field: string = 'All') => {
  return useQuery({
    queryKey: ['feed', field],
    queryFn: async (): Promise<FeedPost[]> => {
      console.log('Fetching feed from Supabase...');
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url,
            field_of_study
          )
        `)
        .order('created_at', { ascending: false });

      if (field !== 'All') {
        query = query.eq('field', field);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching feed:', error);
        // Fallback to mock data on error (e.g., table doesn't exist yet)
        return filterMockFeed(field);
      }

      if (!data || data.length === 0) {
        console.log('No posts found in DB, using Mock Data.');
        return filterMockFeed(field);
      }

      // Transform DB data to FeedPost
      return data.map((post: any) => {
        const author: Author = {
          id: post.profiles?.id || 'unknown',
          name: post.profiles?.full_name || 'Unknown Author',
          avatarUrl: post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown',
          role: 'Researcher', // Default for now
          reputation: 0 // Not in DB yet
        };

        return {
          id: post.id,
          type: 'comic', // Default
          title: post.title,
          abstract: post.abstract || '',
          field: post.field as any,
          author: author,
          timestamp: new Date(post.created_at).toLocaleDateString(), // Simple formatting
          likes: post.likes_count || 0,
          saves: post.saves_count || 0,
          manifest: post.manifest_json as ComicManifest,
          tags: post.tags || []
        };
      });
    }
  });
};

function filterMockFeed(field: string): FeedPost[] {
  return field === 'All' 
    ? MOCK_FEED 
    : MOCK_FEED.filter(p => p.field === field);
}
