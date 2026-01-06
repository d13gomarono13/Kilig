import React from 'react';
import { BarChart } from './BarChart';
import { ProcessFlow } from './ProcessFlow';
import { NetworkGraph } from './NetworkGraph';

const TEMPLATES: Record<string, React.FC<any>> = {
  'bar-chart': BarChart,
  'process-flow': ProcessFlow,
  'network-graph': NetworkGraph,
  'molecular-structure': NetworkGraph, // Reuse for now
  'attention-mechanism': NetworkGraph, // Reuse for now
};

export const renderTemplate = (templateId: string, data: any) => {
  const Component = TEMPLATES[templateId] || BarChart; // Default to BarChart
  return <Component data={data} />;
};
