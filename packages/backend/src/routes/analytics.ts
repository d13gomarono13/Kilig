import { FastifyInstance } from 'fastify';
import { supabase } from '../utils/supabase.js';

export async function analyticsRoutes(server: FastifyInstance) {
  server.get('/api/analytics/runs', async (request, reply) => {
    try {
      // Fetch the last 100 runs, ordered by newest first
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select(`
          id,
          domain,
          source_title,
          source_url,
          status,
          quality_score,
          total_duration_ms,
          created_at,
          metadata
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch analytics data' });
      }

      return { runs: data };
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}
