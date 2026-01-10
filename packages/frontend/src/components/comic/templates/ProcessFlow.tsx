import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const ProcessFlow = ({ data }: { data: any }) => {
  // Expecting data: { steps: string[] }
  const steps = data.steps || ["Input", "Processing", "Output"];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 bg-slate-50">
      {steps.map((step: string, i: number) => (
        <React.Fragment key={i}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.4 }}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2 font-bold text-sm uppercase rounded-md min-w-[120px] text-center"
            >
                {step}
            </motion.div>
            {i < steps.length - 1 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.4 + 0.2 }}
                >
                    <ArrowRight className="text-black" />
                </motion.div>
            )}
        </React.Fragment>
      ))}
    </div>
  );
};
