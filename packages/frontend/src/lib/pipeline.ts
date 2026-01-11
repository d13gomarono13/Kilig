export type AgentType = "scientist" | "narrative_architect" | "designer" | "root";
export type LogLevel = "info" | "success" | "error" | "agent";

export interface LogEntry {
  id: string;
  timestamp: string;
  agent?: AgentType;
  level: LogLevel;
  message: string;
}

export interface PipelineEvent {
  type: 'project_created' | 'agent_event' | 'artifact_updated' | 'done' | 'error';
  projectId?: string;
  author?: AgentType;
  text?: string;
  toolCalls?: any[];
  artifactType?: 'analysis' | 'script' | 'scenegraph';
  content?: string;
  code?: string;
  message?: string;
  timestamp?: string;
}

export interface PipelineOptions {
  query: string;
  onEvent: (event: PipelineEvent) => void;
  onError: (error: any) => void;
  onDone: () => void;
}

export function runPipeline({ query, onEvent, onError, onDone }: PipelineOptions) {
  const controller = new AbortController();

  fetch('/api/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    signal: controller.signal,
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    function push() {
      reader?.read().then(({ done, value }) => {
        if (done) {
          onDone();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as PipelineEvent;
              onEvent(data);
              if (data.type === 'done') {
                onDone();
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
        push();
      }).catch(err => {
        if (err.name !== 'AbortError') {
          onError(err);
        }
      });
    }

    push();
  }).catch(err => {
    if (err.name !== 'AbortError') {
      onError(err);
    }
  });

  return () => controller.abort();
}
