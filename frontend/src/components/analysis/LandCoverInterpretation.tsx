
import React from 'react';

type LandCoverInterpretationData = {
  model?: string;
  method?: string;
  percentages?: Record<string, number>;
  pixel_counts?: Record<string, number>;
  total_pixels?: number;
  warning?: string;
};

type Props = {
  data?: LandCoverInterpretationData;
};

const categories = [
  { key: 'water', label: 'Water' },
  { key: 'vegetation', label: 'Vegetation' },
  { key: 'bare_land', label: 'Bare land' },
  { key: 'built_up', label: 'Built-up areas' },
  { key: 'other', label: 'Other land-cover classes' },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);

const LandCoverInterpretation: React.FC<Props> = ({ data }) => {
  if (!data?.percentages) {
    return (
      <div className="rounded-xl border border-[#D3E1D8] bg-white p-5">
        <h3 className="text-lg font-semibold text-[#173D2D]">
          Land-Cover Interpretation
        </h3>
        <p className="mt-2 text-sm text-[#789087]">
          Interpretation is unavailable because segmentation percentages
          were not returned for this image.
        </p>
      </div>
    );
  }

  const results = categories.map((category) => {
    const rawPercentage = Number(data.percentages?.[category.key] ?? 0);
    const percentage = Number.isFinite(rawPercentage)
      ? Math.max(0, Math.min(100, rawPercentage))
      : 0;

    const rawCount = Number(data.pixel_counts?.[category.key] ?? 0);
    const pixelCount = Number.isFinite(rawCount)
      ? Math.max(0, rawCount)
      : 0;

    return {
      ...category,
      percentage,
      pixelCount,
    };
  });

  const rankedResults = [...results].sort(
    (a, b) => b.percentage - a.percentage
  );

  const dominant = rankedResults[0];
  const totalPixels = Number(data.total_pixels);
  const hasTotalPixels =
    Number.isFinite(totalPixels) && totalPixels > 0;

  const nonZeroResults = rankedResults.filter(
    (item) => item.percentage > 0
  );

  return (
    <section className="rounded-xl border border-[#D3E1D8] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E5F1E9] text-[#287B50]">
          <span className="text-xl" aria-hidden="true">✦</span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#32815C]">
            Scene summary
          </p>
          <h3 className="mt-1 text-xl font-bold text-[#173D2D]">
            Land-Cover Interpretation
          </h3>
          <p className="mt-1 text-sm text-[#789087]">
            A plain-language explanation of the segmentation predictions.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-[#F3F7F3] p-4">
        <p className="text-sm leading-6 text-[#214738]">
          The largest predicted category is{' '}
          <strong>{dominant.label}</strong>, accounting for{' '}
          <strong>{dominant.percentage.toFixed(2)}%</strong> of the
          classified image
          {hasTotalPixels
            ? ` (${formatNumber(dominant.pixelCount)} pixels).`
            : '.'}
          {' '}
          These values describe the model's segmentation output,
          not independently verified land-cover measurements.
        </p>
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold text-[#173D2D]">
          Category-by-category interpretation
        </h4>

        <div className="mt-3 space-y-3">
          {nonZeroResults.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-[#E3EBE5] p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-[#214738]">
                  {item.label}
                </span>
                <span className="text-sm font-bold text-[#173D2D]">
                  {item.percentage.toFixed(2)}%
                </span>
              </div>

              <p className="mt-1 text-sm leading-5 text-[#64786D]">
                The model assigned{' '}
                <strong>{item.percentage.toFixed(2)}%</strong> of the
                image pixels to {item.label.toLowerCase()}
                {hasTotalPixels
                  ? `, representing ${formatNumber(item.pixelCount)} of ${formatNumber(totalPixels)} pixels.`
                  : '.'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {data.warning && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs leading-5 text-amber-900">
            {data.warning}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-[#81958C]">
        Model: {data.model || 'Not specified'}.
        {' '}Interpretation is generated from the reported category
        percentages and pixel counts. Segmentation predictions may be
        inaccurate, especially on satellite imagery, and should be
        validated before being used for real-world decisions.
      </p>
    </section>
  );
};

export default LandCoverInterpretation;
