import React from 'react';
import { motion } from 'framer-motion';

export const NetworkGraph = ({ data }: { data: any }) => {
  // Expecting data: { nodes: { id, label }[], links: { source, target }[] }
  // Mocking layout logic for now
  const nodes = [
    { id: "A", x: 50, y: 50, color: "bg-red-500" },
    { id: "B", x: 30, y: 70, color: "bg-blue-500" },
    { id: "C", x: 70, y: 70, color: "bg-green-500" },
    { id: "D", x: 50, y: 30, color: "bg-yellow-500" },
  ];

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
         <motion.line x1="50%" y1="50%" x2="30%" y2="70%" stroke="white" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
         <motion.line x1="50%" y1="50%" x2="70%" y2="70%" stroke="white" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
         <motion.line x1="50%" y1="50%" x2="50%" y2="30%" stroke="white" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
      </svg>
      
      {nodes.map((node, i) => (
        <motion.div
            key={node.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: i * 0.2 }}
            className={`absolute w-8 h-8 rounded-full border-2 border-white ${node.color} flex items-center justify-center text-white font-bold text-xs z-10`}
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
        >
            {node.id}
        </motion.div>
      ))}
    </div>
  );
};
