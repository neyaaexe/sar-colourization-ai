import React from 'react';
import { TerrainAnalysisData } from '../../types';

interface TerrainAnalysisProps {
  data: TerrainAnalysisData;
}

export const TerrainAnalysis: React.FC<TerrainAnalysisProps> = ({ data }) => {
  const confidence = Math.max(
    0,
    Math.min(100, data.confidence ?? 0)
  );

  const terrain = data.predicted_terrain || 'Unknown';
  const model = data.model || 'EuroSAT-Swin';
  const device = data.device || 'cuda';

  return (
    <div className="rounded-2xl border border-[#D8E2DB] bg-white overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E2E8E3]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#18704F]">
          Terrain
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-[#123D2D]">
          Terrain Classification
        </h2>

        <p className="mt-2 text-sm text-[#718078]">
          Land-cover classification from the processed SAR image.
        </p>
      </div>

      {/* Content */}
      <div className="p-6">

        {/* Prediction */}
        <div className="rounded-xl bg-[#F5F8F5] border border-[#E0E7E1] p-5">

          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C8982]">
            Predicted class
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">

            <h3 className="text-2xl font-semibold text-[#123D2D]">
              {terrain}
            </h3>

            <span className="rounded-full bg-[#E2F0E8] px-3 py-1 text-xs font-semibold text-[#176B4B]">
              Classified
            </span>

          </div>

        </div>

        {/* Confidence */}
        <div className="mt-5">

          <div className="flex items-center justify-between">

            <p className="text-sm font-medium text-[#40554B]">
              Model confidence
            </p>

            <p className="text-sm font-semibold text-[#176B4B]">
              {confidence.toFixed(2)}%
            </p>

          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#E4EBE6]">

            <div
              className="h-full rounded-full bg-[#176B4B] transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />

          </div>

        </div>

        {/* Model information */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="rounded-xl border border-[#E0E7E1] p-4">

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928C]">
              Model
            </p>

            <p className="mt-2 text-sm font-medium text-[#123D2D]">
              {model}
            </p>

          </div>

          <div className="rounded-xl border border-[#E0E7E1] p-4">

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928C]">
              Device
            </p>

            <p className="mt-2 text-sm font-medium text-[#123D2D]">
              {device}
            </p>

          </div>

        </div>

        {/* Status */}
        <div className="mt-5 flex items-center gap-2 text-sm text-[#617169]">

          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E2F0E8] text-xs text-[#176B4B]">
            ✓
          </span>

          <span>
            Terrain classification completed successfully
          </span>

        </div>

      </div>

    </div>
  );
};

export default TerrainAnalysis;