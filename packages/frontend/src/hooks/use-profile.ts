import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { UserProfile, MOCK_PROFILE } from '../data/profile-data';
import { FeedPost, Author } from '../data/feed-data';
import { ComicManifest } from '../components/comic/types';
import { useAuth } from '../lib/auth';

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserProfile> => {
      console.log('Fetching profile from Supabase...');
      
      // 1. Fetch Profile Details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileError) {
        console.warn('Error fetching profile, using Mock:', profileError);
        return MOCK_PROFILE;
      }

      // 2. Fetch User's Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      // 3. Fetch Saved Posts (via interactions)
      // Note: This requires a join on interactions -> posts -> profiles
      const { data: savedData } = await supabase
        .from('interactions')
        .select(`
          post_id,
          posts (
            *,
            profiles (id, full_name, avatar_url)
          )
        `)
        .eq('user_id', user!.id)
        .eq('type', 'save');

      // Helper to transform DB post to FeedPost
      const transformPost = (post: any, authorProfile: any = null): FeedPost => {
         const author: Author = {
          id: authorProfile?.id || profileData.id,
          name: authorProfile?.full_name || profileData.full_name,
          avatarUrl: authorProfile?.avatar_url || profileData.avatar_url,
          role: 'Researcher',
          reputation: 0
        };

        return {
          id: post.id,
          type: 'comic',
          title: post.title,
          abstract: post.abstract || '',
          field: post.field as any,
          author: author,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          likes: post.likes_count || 0,
          saves: post.saves_count || 0,
          manifest: post.manifest_json as ComicManifest,
          tags: post.tags || []
        };
      };

      const myPosts = postsData?.map(p => transformPost(p)) || [];
      
      const savedPosts = savedData?.map((item: any) => {
        if (!item.posts) return null;
        return transformPost(item.posts, item.posts.profiles);
      }).filter(Boolean) as FeedPost[] || [];

      // Construct Profile Object
      return {
        id: profileData.id,
        name: profileData.full_name || user!.name,
        role: profileData.field_of_study || 'Researcher',
        institution: 'Kilig Institute', // Placeholder or add to DB
        bio: profileData.bio || 'No bio yet.',
        avatarUrl: profileData.avatar_url || user!.avatar,
        stats: {
          reputation: 0, // Placeholder
          works: myPosts.length,
          followers: 0,
          following: 0
        },
        posts: myPosts,
        saved: savedPosts,
        drafts: [] // Drafts logic to be implemented later
      };
    }
  });
};
