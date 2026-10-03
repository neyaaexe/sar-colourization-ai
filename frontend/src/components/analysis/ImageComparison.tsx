import React from 'react';
import {
  Maximize2,
  X,
  GripVertical,
  Download,
} from 'lucide-react';

interface ImageComparisonProps {
  originalSarUrl: string;
  pix2pixRgbUrl: string;
}

export const ImageComparison: React.FC<
  ImageComparisonProps
> = ({
  originalSarUrl,
  pix2pixRgbUrl,
}) => {
  const [showModal, setShowModal] =
    React.useState(false);

  const [sliderPosition, setSliderPosition] =
    React.useState(50);

  const comparisonRef =
    React.useRef<HTMLDivElement>(null);

  const handleSliderMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!comparisonRef.current) return;

    const rect =
      comparisonRef.current.getBoundingClientRect();

    const position =
      ((event.clientX - rect.left) / rect.width) * 100;

    setSliderPosition(
      Math.max(0, Math.min(100, position))
    );
  };

  if (!originalSarUrl || !pix2pixRgbUrl) {
    return null;
  }

  return (
    <>
      {/* COMPARISON */}
      <div
        ref={comparisonRef}
        className="relative w-full h-[420px] sm:h-[520px] bg-black border border-[#D8E2DB] overflow-hidden select-none"
        onPointerMove={(event) => {
          if (event.buttons === 1) {
            handleSliderMove(event);
          }
        }}
      >

        {/* PIX2PIX — BACKGROUND */}
        <div className="absolute inset-0 overflow-hidden">

          <img
            src={pix2pixRgbUrl}
            alt="Pix2Pix optical representation"
            className="w-full h-full object-contain bg-black"
            draggable={false}
          />

          <div className="absolute top-4 right-4 bg-[#123D2D]/90 px-3 py-2 rounded-md">
            <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
              Pix2Pix Output
            </span>
          </div>

        </div>


        {/* SAR — CLIPPED LAYER */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{
            width: `${sliderPosition}%`,
          }}
        >

          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: comparisonRef.current
                ? `${(100 / sliderPosition) * 100}%`
                : '200%',
            }}
          >

            <img
              src={originalSarUrl}
              alt="Original SAR"
              className="w-full h-full object-contain bg-black"
              draggable={false}
            />

          </div>

          <div className="absolute top-4 left-4 bg-[#123D2D]/90 px-3 py-2 rounded-md">
            <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
              SAR Input
            </span>
          </div>

        </div>


        {/* SLIDER LINE */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-lg z-10 cursor-ew-resize"
          style={{
            left: `${sliderPosition}%`,
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(
              event.pointerId
            );
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) {
              handleSliderMove(event);
            }
          }}
        >

          {/* HANDLE */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                       w-10 h-10 rounded-full bg-white shadow-xl
                       flex items-center justify-center
                       border-2 border-[#176B4B]"
          >
            <GripVertical
              className="w-5 h-5 text-[#176B4B]"
            />
          </div>

        </div>


        {/* INSTRUCTION */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="rounded-full bg-black/70 backdrop-blur-sm px-4 py-2 text-[10px] text-white/80">
            Drag the slider to compare
          </div>
        </div>
         {/* DOWNLOAD */}
<a
  href={pix2pixRgbUrl}
  download="pix2pix-optical-result.png"
  className="absolute bottom-4 right-[120px] z-20
             flex items-center gap-2
             rounded-md
             bg-white/95
             border border-[#D8E2DB]
             px-3 py-2
             text-[#123D2D]
             hover:bg-white
             transition-colors
             shadow-sm"
  title="Download Pix2Pix image"
>
  <Download className="w-3.5 h-3.5" />

  <span className="text-[10px] font-semibold uppercase tracking-wide">
    Download
  </span>
</a>

        {/* FULLSCREEN */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="absolute bottom-4 right-4 z-20
                     flex items-center gap-2
                     rounded-md
                     bg-white/95
                     border border-[#D8E2DB]
                     px-3 py-2
                     text-[#123D2D]
                     hover:bg-white
                     transition-colors shadow-sm"
          title="Open full screen"
        >

          <Maximize2 className="w-3.5 h-3.5" />

          <span className="text-[10px] font-semibold uppercase tracking-wide">
            Fullscreen
          </span>

        </button>

      </div>


      {/* LEGEND */}
      <div className="grid grid-cols-2 border-x border-b border-[#D8E2DB] bg-white">

        <div className="px-4 py-3 border-r border-[#D8E2DB]">

          <div className="text-[9px] font-semibold uppercase tracking-wider text-[#87928C]">
            Source
          </div>

          <div className="text-xs font-medium text-[#40554B] mt-1">
            Sentinel-1 SAR
          </div>

        </div>


        <div className="px-4 py-3">

          <div className="text-[9px] font-semibold uppercase tracking-wider text-[#87928C]">
            Derived product
          </div>

          <div className="text-xs font-medium text-[#40554B] mt-1">
            Pix2Pix RGB
          </div>

        </div>

      </div>


      {/* FULLSCREEN MODAL */}
      {showModal && (

        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-5"
          onClick={() => setShowModal(false)}
        >

          <div
            className="w-full max-w-[1400px]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border border-[#30373b] bg-[#0e1214] px-4 py-3">

              <span className="text-[10px] uppercase tracking-wider text-gray-400">
                SAR / Pix2Pix comparison
              </span>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="text-gray-400 hover:text-white transition-colors"
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            {/* MODAL COMPARISON */}
            <div
              className="relative w-full h-[80vh] bg-black border-x border-b border-[#30373b] overflow-hidden select-none"
              onPointerMove={(event) => {

                if (event.buttons !== 1) return;

                const rect =
                  event.currentTarget.getBoundingClientRect();

                const position =
                  ((event.clientX - rect.left) /
                    rect.width) *
                  100;

                setSliderPosition(
                  Math.max(0, Math.min(100, position))
                );

              }}
            >

              {/* PIX2PIX */}
              <div className="absolute inset-0">

                <img
                  src={pix2pixRgbUrl}
                  alt="Pix2Pix optical representation"
                  className="w-full h-full object-contain"
                  draggable={false}
                />

                <span className="absolute top-4 right-4 bg-black/80 px-3 py-2 rounded-md text-[10px] text-white uppercase tracking-wider">
                  Pix2Pix Output
                </span>

              </div>


              {/* SAR */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{
                  width: `${sliderPosition}%`,
                }}
              >

                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${10000 / Math.max(sliderPosition, 1)}%`,
                  }}
                >

                  <img
                    src={originalSarUrl}
                    alt="Original SAR"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />

                </div>

                <span className="absolute top-4 left-4 bg-black/80 px-3 py-2 rounded-md text-[10px] text-white uppercase tracking-wider">
                  SAR Input
                </span>

              </div>


              {/* DIVIDER */}
              <div
                className="absolute inset-y-0 w-0.5 bg-white z-10 cursor-ew-resize"
                style={{
                  left: `${sliderPosition}%`,
                }}
              >

                <div
                  className="absolute top-1/2 left-1/2
                             -translate-x-1/2
                             -translate-y-1/2
                             w-12 h-12 rounded-full
                             bg-white
                             shadow-xl
                             flex items-center justify-center
                             border-2 border-[#176B4B]"
                >

                  <GripVertical
                    className="w-6 h-6 text-[#176B4B]"
                  />

                </div>

              </div>


              {/* MODAL INSTRUCTION */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">

                <div className="rounded-full bg-black/70 px-5 py-2 text-xs text-white/80">
                  Drag to compare SAR and Pix2Pix
                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
};

export default ImageComparison;