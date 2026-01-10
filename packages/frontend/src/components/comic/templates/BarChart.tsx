import React from 'react';
import { motion } from 'framer-motion';

export const BarChart = ({ data }: { data: any }) => {
  // Expecting data: { labels: string[], values: number[] }
  const labels = data.labels || ["A", "B", "C", "D", "E"];
  const values = data.values || [40, 70, 45, 90, 65];
  const maxValue = Math.max(...values, 100);

  return (
    <div className="w-full h-full flex items-end justify-center gap-2 p-4 bg-slate-900">
      {values.map((val: number, i: number) => (
        <div key={i} className="flex flex-col items-center gap-1 w-8">
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(val / maxValue) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                className="w-full bg-neo-blue border-t-2 border-x-2 border-white/50 rounded-t-sm"
            />
            <span className="text-[10px] text-white/70 font-mono">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
};
