import React from 'react';
import {
  CheckCircle2,
  Loader2,
  Circle,
} from 'lucide-react';

interface ProcessingMessageProps {
  currentStage: number;
}

export const ProcessingMessage: React.FC<
  ProcessingMessageProps
> = ({ currentStage }) => {
  const steps = [
    {
      label: 'Image uploaded',
      stageIdx: 0,
    },
    {
      label: 'Pix2Pix optical translation',
      stageIdx: 1,
    },
    {
      label: 'Terrain classification',
      stageIdx: 2,
    },
    {
      label: 'Image metrics',
      stageIdx: 3,
    },
  ];

  return (
    <div className="border border-[#30373b] bg-[#0e1214]">

      <div className="px-4 py-3 border-b border-[#2a2f33]">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-600">
          Processing pipeline
        </span>
      </div>

      <div className="p-4 space-y-3">

        {steps.map((step) => {
          const isDone =
            currentStage > step.stageIdx;

          const isCurrent =
            currentStage === step.stageIdx;

          return (
            <div
              key={step.label}
              className="flex items-center gap-3"
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6eaf75]" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 text-[#d6a84f] animate-spin" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-gray-700" />
              )}

              <span
                className={`
                  font-mono text-[10px]
                  ${
                    isDone
                      ? 'text-gray-400'
                      : isCurrent
                      ? 'text-[#d6a84f]'
                      : 'text-gray-700'
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default ProcessingMessage;