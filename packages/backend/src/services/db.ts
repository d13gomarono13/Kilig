import { supabase } from '../utils/supabase.js';

/**
 * Database Service
 * Handles interactions with Supabase for storing agent artifacts.
 */

export interface VideoProject {
  id?: string;
  topic: string;
  status: 'researching' | 'scripting' | 'designing' | 'completed' | 'failed';
  research_summary?: any;
  script?: any;
  scenegraph?: any;
  created_at?: string;
}

export const dbService = {
  /**
   * Create a new video project entry
   */
  async createProject(topic: string): Promise<VideoProject | null> {
    const { data, error } = await supabase
      .from('video_projects')
      .insert([{ topic, status: 'researching' }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      return null;
    }
    return data;
  },

  /**
   * Update the project status and save artifacts (Analysis, Script, SceneGraph)
   */
  async updateProjectArtifact(id: string, update: Partial<VideoProject>) {
    const { error } = await supabase
      .from('video_projects')
      .update(update)
      .eq('id', id);

    if (error) {
      console.error(`Error updating project ${id}:`, error);
    }
  }
};
