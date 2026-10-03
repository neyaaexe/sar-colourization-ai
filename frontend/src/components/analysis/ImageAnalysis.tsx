import React from 'react';
import { ImageAnalysisData } from '../../types';

interface ImageAnalysisProps {
  data: ImageAnalysisData;
}

export const ImageAnalysis: React.FC<ImageAnalysisProps> = ({ data }) => {
  const dimensions =
    data.image_width !== undefined && data.image_height !== undefined
      ? `${data.image_width} × ${data.image_height}`
      : data.dimensions || 'Unknown';

  const format =
    data.format ||
    data.file_format ||
    'Unknown';

  const brightnessValue =
    typeof data.brightness === 'number'
      ? data.brightness
      : typeof data.mean_brightness === 'number'
        ? data.mean_brightness
        : null;

  const brightness =
    brightnessValue !== null
      ? brightnessValue.toFixed(2)
      : 'Unavailable';

  const contrastValue =
    typeof data.contrast === 'number'
      ? data.contrast
      : null;

  const contrast =
    contrastValue !== null
      ? contrastValue.toFixed(2)
      : 'Unavailable';

  const dominantChannel =
    data.dominant_channel || 'Unknown';

  const channels =
    data.channels !== undefined
      ? typeof data.channels === 'number'
        ? `RGB · ${data.channels}`
        : data.channels
      : 'RGB · 3';

  const redValue =
    typeof data.mean_red === 'number'
      ? data.mean_red
      : null;

  const greenValue =
    typeof data.mean_green === 'number'
      ? data.mean_green
      : null;

  const blueValue =
    typeof data.mean_blue === 'number'
      ? data.mean_blue
      : null;

  const red =
    redValue !== null
      ? redValue.toFixed(2)
      : '—';

  const green =
    greenValue !== null
      ? greenValue.toFixed(2)
      : '—';

  const blue =
    blueValue !== null
      ? blueValue.toFixed(2)
      : '—';

  /*
   * Convert RGB values into percentages for the visual bars.
   * Most RGB statistics are in the 0–255 range.
   */
  const redPercent =
    redValue !== null
      ? Math.min(100, Math.max(0, (redValue / 255) * 100))
      : 0;

  const greenPercent =
    greenValue !== null
      ? Math.min(100, Math.max(0, (greenValue / 255) * 100))
      : 0;

  const bluePercent =
    blueValue !== null
      ? Math.min(100, Math.max(0, (blueValue / 255) * 100))
      : 0;

  /*
   * Brightness is normally represented on a 0–255 scale.
   * The visual indicator is clamped so it never leaves the card.
   */
  const brightnessPercent =
    brightnessValue !== null
      ? Math.min(100, Math.max(0, (brightnessValue / 255) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-[#D8E2DB] bg-white overflow-hidden">

      {/* HEADER */}
      <div className="px-6 py-5 border-b border-[#E2E8E3]">

        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#18704F]">
          Image data
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-[#123D2D]">
          Image Statistics
        </h2>

        <p className="mt-2 text-sm text-[#718078]">
          Measured properties of the generated optical image.
        </p>

      </div>


      {/* CONTENT */}
      <div className="p-6">


        {/* OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* DIMENSIONS */}
          <div className="rounded-xl bg-[#F5F8F5] border border-[#E0E7E1] p-5">

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928C]">
              Dimensions
            </p>

            <p className="mt-2 text-xl font-semibold text-[#123D2D]">
              {dimensions}
            </p>

            <p className="mt-1 text-xs text-[#87928C]">
              Image resolution
            </p>

          </div>


          {/* FORMAT */}
          <div className="rounded-xl bg-[#F5F8F5] border border-[#E0E7E1] p-5">

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928C]">
              Format
            </p>

            <p className="mt-2 text-xl font-semibold text-[#123D2D] uppercase">
              {format}
            </p>

            <p className="mt-1 text-xs text-[#87928C]">
              Output image format
            </p>

          </div>


          {/* CHANNELS */}
          <div className="rounded-xl bg-[#F5F8F5] border border-[#E0E7E1] p-5">

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928C]">
              Channels
            </p>

            <p className="mt-2 text-xl font-semibold text-[#123D2D]">
              {channels}
            </p>

            <p className="mt-1 text-xs text-[#87928C]">
              Colour information
            </p>

          </div>

        </div>


        {/* IMAGE MEASUREMENTS */}
        <div className="mt-8">

          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928C] mb-3">
            Image measurements
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


            {/* BRIGHTNESS */}
            <div className="rounded-xl border border-[#E0E7E1] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-[#40554B]">
                    Brightness
                  </p>

                  <p className="mt-1 text-xs text-[#87928C]">
                    Mean image intensity
                  </p>
                </div>

                <p className="text-xl font-semibold text-[#176B4B]">
                  {brightness}
                </p>

              </div>


              <div className="mt-4 h-2.5 w-full rounded-full bg-[#E4EBE6] overflow-hidden">

                <div
                  className="h-full rounded-full bg-[#176B4B] transition-all duration-700"
                  style={{
                    width: `${brightnessPercent}%`,
                  }}
                />

              </div>


              <div className="mt-2 flex justify-between text-[10px] text-[#9AA59F]">
                <span>Dark</span>
                <span>Bright</span>
              </div>

            </div>


            {/* CONTRAST */}
            <div className="rounded-xl border border-[#E0E7E1] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-[#40554B]">
                    Contrast
                  </p>

                  <p className="mt-1 text-xs text-[#87928C]">
                    Image intensity variation
                  </p>
                </div>

                <p className="text-xl font-semibold text-[#176B4B]">
                  {contrast}
                </p>

              </div>


              <div className="mt-4 h-2.5 w-full rounded-full bg-[#E4EBE6] overflow-hidden">

                <div
                  className="h-full rounded-full bg-[#2D8060]"
                  style={{
                    width:
                      contrastValue !== null
                        ? `${Math.min(
                            100,
                            Math.max(
                              0,
                              (contrastValue / 128) * 100
                            )
                          )}%`
                        : '0%',
                  }}
                />

              </div>


              <div className="mt-2 flex justify-between text-[10px] text-[#9AA59F]">
                <span>Low</span>
                <span>High</span>
              </div>

            </div>

          </div>

        </div>


        {/* RGB ANALYSIS */}
        <div className="mt-8">

          <div className="flex items-end justify-between mb-3">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928C]">
                Colour channels
              </p>

              <p className="mt-1 text-xs text-[#87928C]">
                Mean RGB intensity distribution
              </p>
            </div>

            <div className="text-xs text-[#87928C]">
              0 — 255
            </div>

          </div>


          <div className="rounded-xl border border-[#E0E7E1] bg-[#FAFBF9] p-5 space-y-5">


            {/* RED */}
            <div>

              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">

                  <span className="w-2.5 h-2.5 rounded-full bg-[#D94B4B]" />

                  <span className="text-sm font-medium text-[#40554B]">
                    Red
                  </span>

                </div>

                <span className="text-sm font-semibold text-[#123D2D]">
                  {red}
                </span>

              </div>


              <div className="h-3 rounded-full bg-[#F0E4E4] overflow-hidden">

                <div
                  className="h-full rounded-full bg-[#D94B4B] transition-all duration-700"
                  style={{
                    width: `${redPercent}%`,
                  }}
                />

              </div>

            </div>


            {/* GREEN */}
            <div>

              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">

                  <span className="w-2.5 h-2.5 rounded-full bg-[#3D9B62]" />

                  <span className="text-sm font-medium text-[#40554B]">
                    Green
                  </span>

                </div>

                <span className="text-sm font-semibold text-[#123D2D]">
                  {green}
                </span>

              </div>


              <div className="h-3 rounded-full bg-[#E2EDE5] overflow-hidden">

                <div
                  className="h-full rounded-full bg-[#3D9B62] transition-all duration-700"
                  style={{
                    width: `${greenPercent}%`,
                  }}
                />

              </div>

            </div>


            {/* BLUE */}
            <div>

              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">

                  <span className="w-2.5 h-2.5 rounded-full bg-[#4E79B8]" />

                  <span className="text-sm font-medium text-[#40554B]">
                    Blue
                  </span>

                </div>

                <span className="text-sm font-semibold text-[#123D2D]">
                  {blue}
                </span>

              </div>


              <div className="h-3 rounded-full bg-[#E4E8F0] overflow-hidden">

                <div
                  className="h-full rounded-full bg-[#4E79B8] transition-all duration-700"
                  style={{
                    width: `${bluePercent}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </div>


        {/* DOMINANT CHANNEL */}
        <div className="mt-6 rounded-xl bg-[#F1F7F3] border border-[#D8E7DC] p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#718078]">
                Dominant channel
              </p>

              <p className="mt-1 text-lg font-semibold text-[#123D2D] uppercase">
                {dominantChannel}
              </p>

            </div>

            <div className="w-10 h-10 rounded-full bg-[#DDEDE5] flex items-center justify-center text-[#176B4B] font-semibold">
              RGB
            </div>

          </div>

        </div>


        {/* STATUS */}
        <div className="mt-5 flex items-center gap-2 text-sm text-[#617169]">

          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E2F0E8] text-xs text-[#176B4B]">
            ✓
          </span>

          <span>
            Image statistics calculated successfully
          </span>

        </div>

      </div>

    </div>
  );
};

export default ImageAnalysis;