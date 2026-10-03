import React, { useRef, useEffect } from 'react';
import { ConversationSession } from '../../types';
import { ProcessingMessage } from './ProcessingMessage';
import { ImageComparison } from '../analysis/ImageComparison';
import { TerrainAnalysis } from '../analysis/TerrainAnalysis';
import { ImageAnalysis } from '../analysis/ImageAnalysis';
import { Satellite, Upload, Sparkles, CheckCircle2 } from 'lucide-react';

interface ChatWindowProps {
  conversation: ConversationSession | null;
  processingStage: number | null; // null if not processing
  onUploadClick: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  processingStage,
  onUploadClick,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.images, processingStage]);

  if (!conversation) {
    return null;
  }

  // Find images and analyses
  const sarImg = conversation.images.find((img) => img.type === 'original_sar')?.file_path;
 const wflmganImg = conversation.images.find(
  (img) =>
    img.type === 'pix2pix_rgb' ||
    img.type === 'wflmgan_rgb' ||
    img.type === 'mcgan_rgb'
)?.file_path;
  const analysisObj = conversation.analyses[0];

  const hasProcessedData = Boolean(sarImg && wflmganImg && analysisObj);
  const isEmptyState = !hasProcessedData && processingStage === null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-4">
      {isEmptyState ? (
        <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center p-6 my-auto">
          <div className="w-16 h-16 rounded-2xl bg-sar-deepPurple/30 border border-sar-purple/50 flex items-center justify-center text-sar-cyan mb-4 shadow-[0_0_30px_rgba(157,78,221,0.4)] animate-pulse-slow">
            <Satellite className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-wide font-sans">
            SAR Colourization using AI
          </h2>
          <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed font-mono">
            Transform SAR radar imagery into intelligent, colorized visual insights. Upload a Synthetic Aperture Radar image to generate WFLM-GAN optical translation, terrain classification, and spatial analytics.
          </p>
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 bg-gradient-to-r from-sar-deepPurple via-sar-purple to-sar-blue hover:scale-105 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(157,78,221,0.5)] transition-all border border-sar-purple/40"
          >
            <Upload className="w-4 h-4 text-sar-cyan" />
            <span>Upload SAR Image to Begin</span>
          </button>
        </div>
      ) : (
        <>
          {/* Processing Animation */}
          {processingStage !== null && (
            <ProcessingMessage currentStage={processingStage} />
          )}

          {/* Analysis Results View */}
          {hasProcessedData && sarImg && wflmganImg && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex items-center justify-between p-3 rounded-xl glass-card border border-sar-purple/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                    Analysis Results: {conversation.title}
                  </span>
                </div>
                <span className="text-[10px] text-sar-cyan font-mono bg-sar-deepPurple/40 px-2.5 py-1 rounded-full border border-sar-purple/40">
                  {conversation.images.length} Image Artifacts
                </span>
              </div>

              {/* 1. Image Comparison Slider */}
              <ImageComparison originalSarUrl={sarImg} pix2pixRgbUrl={wflmganImg} />

              {/* 2. Terrain Analysis Chart */}
              {analysisObj.terrain_analysis && (
                <TerrainAnalysis data={analysisObj.terrain_analysis} />
              )}

              {/* 3. Image Analysis Statistics */}
              {analysisObj.image_analysis && (
                <ImageAnalysis data={analysisObj.image_analysis} />
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
};
