import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface VideoProject {
    id: string;
    topic: string;
    status: 'researching' | 'scripting' | 'designing' | 'completed' | 'failed';
    research_summary?: string;
    script?: string;
    scenegraph?: any;
    created_at: string;
}

export const useProject = (id: string | undefined) => {
    return useQuery({
        queryKey: ["project", id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from("video_projects")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching project:", error);
                throw error;
            }

            return data as VideoProject;
        },
        enabled: !!id,
        refetchInterval: (query) => {
            // Poll for updates if the project is not completed/failed
            const status = query.state.data?.status;
            if (status && status !== 'completed' && status !== 'failed') {
                return 2000; // 2 seconds poll while running
            }
            return false;
        }
    });
};
