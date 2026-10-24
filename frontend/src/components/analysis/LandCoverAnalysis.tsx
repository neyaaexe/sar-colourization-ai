
import React from 'react';

type LandCoverData = {
  model?: string;
  method?: string;
  percentages?: Record<string, number>;
  warning?: string;
  segmentation_map_url?: string;
};

type Props = {
  data?: LandCoverData;
};

const categories = [
  {
    key: 'water',
    label: 'Water',
    color: '#398BCB',
  },
  {
    key: 'vegetation',
    label: 'Vegetation',
    color: '#39965B',
  },
  {
    key: 'bare_land',
    label: 'Bare land',
    color: '#B99A70',
  },
  {
    key: 'built_up',
    label: 'Built-up',
    color: '#D56B60',
  },
  {
    key: 'other',
    label: 'Other',
    color: '#9CA3AF',
  },
];

const LandCoverAnalysis: React.FC<Props> = ({ data }) => {
  if (!data?.percentages) {
    return (
      <p className="text-sm text-[#789087]">
        Land-cover results are not available for this image.
      </p>
    );
  }
const apiBase = 'http://127.0.0.1:8000';

  const mapUrl = data.segmentation_map_url
    ? /^https?:\/\//i.test(data.segmentation_map_url)
      ? data.segmentation_map_url
      : `${apiBase}/${data.segmentation_map_url.replace(/^\/+/, '')}`
    : '';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#32815C]">
          Pixel-level estimates
        </p>
        <p className="mt-1 text-sm text-[#789087]">
          Estimated share of each category in the generated image.
        </p>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const rawValue = Number(
            data.percentages?.[category.key] ?? 0
          );

          const percentage = Number.isFinite(rawValue)
            ? Math.min(100, Math.max(0, rawValue))
            : 0;

          return (
            <div key={category.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-[#214738]">
                    {category.label}
                  </span>
                </div>

                <span className="text-sm font-semibold text-[#173D2D]">
                  {percentage.toFixed(2)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#EAF0EB]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {mapUrl && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-[#173D2D]">
            Segmentation Map
          </h4>

          <img
            src={mapUrl}
            alt="Predicted land-cover segmentation map"
            className="w-full rounded-lg border border-[#D3E1D8]"
            loading="lazy"
          />

          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-semibold text-[#287B50] hover:underline"
          >
            Open segmentation map
          </a>
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs leading-5 text-amber-900">
          {data.warning ||
            'These are model predictions, not verified ground-truth measurements.'}
        </p>
      </div>

      <p className="text-xs text-[#81958C]">
        Model: {data.model || 'SegFormer'}
      </p>
    </div>
  );
};

export default LandCoverAnalysis;
