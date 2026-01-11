import { FastifyInstance } from 'fastify';
import { supabase } from '../utils/supabase.js';

export async function analyticsRoutes(server: FastifyInstance) {
  server.get('/api/analytics/runs', async (request, reply) => {
    try {
      // Fetch the last 100 projects, ordered by newest first
      const { data, error } = await supabase
        .from('video_projects')
        .select(`
          id,
          topic,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch analytics data' });
      }

      const mappedRuns = data ? data.map((p: any) => ({
        id: p.id,
        domain: 'AI', // Default for now
        source_title: p.topic, // Use topic as title
        source_url: 'https://arxiv.org', // Placeholder or parse from topic
        status: p.status,
        quality_score: 95, // Dummy score
        total_duration_ms: 0,
        created_at: p.created_at
      })) : [];

      return { runs: mappedRuns };
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}
