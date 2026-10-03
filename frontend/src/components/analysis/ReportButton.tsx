import React from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ConversationSession } from '../../types';

interface ReportButtonProps {
  conversation: ConversationSession;
}

const getImageUrl = (path?: string) => {
  if (!path) return '';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${window.location.origin}${path}`;
};

const loadImageAsDataUrl = async (
  path?: string
): Promise<string | null> => {
  if (!path) return null;

  try {
    const response = await fetch(getImageUrl(path));

    if (!response.ok) {
      throw new Error(`Failed to load image: ${response.status}`);
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Could not convert image'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Could not read image'));
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load report image:', error);
    return null;
  }
};

const addSectionTitle = (
  doc: jsPDF,
  title: string,
  y: number
) => {
  doc.setFillColor(232, 242, 235);
  doc.roundedRect(14, y - 6, 182, 10, 2, 2, 'F');

  doc.setTextColor(18, 61, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, 19, y + 1);

  return y + 15;
};

const addLabelValue = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number
) => {
  doc.setTextColor(105, 123, 114);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(label, x, y);

  doc.setTextColor(18, 61, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(value, x, y + 5);
};

export const ReportButton: React.FC<ReportButtonProps> = ({
  conversation,
}) => {
  const [generating, setGenerating] = React.useState(false);

  const generateReport = async () => {
    if (!conversation) return;

    setGenerating(true);

    try {
      const analysis = conversation.analyses?.[0];

      if (!analysis) {
        alert('Analysis data is not available yet.');
        return;
      }

      const sarImage = conversation.images?.find(
        (image) => image.type === 'original_sar'
      );

      const pix2pixImage = conversation.images
        ?.filter(
          (image) =>
            image.type === 'pix2pix_rgb' ||
            image.type === 'wflmgan_rgb' ||
            image.type === 'mcgan_rgb'
        )
        ?.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )[0];

      const [
        sarDataUrl,
        pix2pixDataUrl,
      ] = await Promise.all([
        loadImageAsDataUrl(sarImage?.file_path),
        loadImageAsDataUrl(pix2pixImage?.file_path),
      ]);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;

      let y = 18;

      /*
       * ------------------------------------------------
       * HEADER
       * ------------------------------------------------
       */

      doc.setFillColor(11, 51, 37);
      doc.roundedRect(
        12,
        12,
        pageWidth - 24,
        30,
        4,
        4,
        'F'
      );

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(
        'SAR Analysis Report',
        20,
        25
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(205, 228, 215);

      doc.text(
        'SAR Colourization using AI · Earth Observation',
        20,
        33
      );

      y = 52;

      /*
       * ------------------------------------------------
       * SCENE INFORMATION
       * ------------------------------------------------
       */

      doc.setTextColor(18, 61, 45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);

      doc.text(
        conversation.title || 'SAR Analysis',
        14,
        y
      );

      y += 8;

      doc.setTextColor(105, 123, 114);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const analysisDate = new Date(
        analysis.created_at
      ).toLocaleString();

      doc.text(
        `Generated: ${analysisDate}`,
        14,
        y
      );

      y += 12;

      /*
       * ------------------------------------------------
       * IMAGE RESULTS
       * ------------------------------------------------
       */

      y = addSectionTitle(
        doc,
        '1. IMAGE RESULTS',
        y
      );

      const imageWidth = 82;
      const imageHeight = 65;

      if (sarDataUrl) {
        doc.setTextColor(18, 61, 45);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(
          'Original SAR',
          14,
          y
        );

        doc.addImage(
          sarDataUrl,
          'PNG',
          14,
          y + 4,
          imageWidth,
          imageHeight
        );
      }

      if (pix2pixDataUrl) {
        doc.setTextColor(18, 61, 45);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(
          'Pix2Pix Optical Result',
          108,
          y
        );

        doc.addImage(
          pix2pixDataUrl,
          'PNG',
          108,
          y + 4,
          imageWidth,
          imageHeight
        );
      }

      y += imageHeight + 15;

      /*
       * ------------------------------------------------
       * TERRAIN ANALYSIS
       * ------------------------------------------------
       */

      y = addSectionTitle(
        doc,
        '2. TERRAIN ANALYSIS',
        y
      );

      const terrain =
        analysis.terrain_analysis || {};

      const predictedTerrain =
        terrain.predicted_terrain ||
        terrain.predicted_terrain||
        'Unknown';

      const confidence =
        typeof terrain.confidence === 'number'
          ? `${terrain.confidence.toFixed(2)}%`
          : 'Unavailable';

      const terrainModel =
        terrain.model ||
        'EuroSAT-Swin';

      const device =
        terrain.device ||
        'GPU';

      addLabelValue(
        doc,
        'Predicted terrain',
        String(predictedTerrain),
        18,
        y
      );

      addLabelValue(
        doc,
        'Confidence',
        confidence,
        78,
        y
      );

      addLabelValue(
        doc,
        'Model',
        String(terrainModel),
        130,
        y
      );

      y += 18;

      addLabelValue(
        doc,
        'Processing device',
        String(device),
        18,
        y
      );

      y += 15;

      /*
       * ------------------------------------------------
       * IMAGE STATISTICS
       * ------------------------------------------------
       */

      y = addSectionTitle(
        doc,
        '3. IMAGE STATISTICS',
        y
      );

      const stats =
        analysis.image_analysis || {};

      const dimensions =
        stats.image_width !== undefined &&
        stats.image_height !== undefined
          ? `${stats.image_width} × ${stats.image_height}`
          : stats.dimensions || 'Unknown';

      const format =
        stats.format ||
        stats.file_format ||
        'Unknown';

      const channels =
        stats.channels !== undefined
          ? String(stats.channels)
          : 'RGB · 3';

      const brightness =
        typeof stats.brightness === 'number'
          ? stats.brightness.toFixed(2)
          : typeof stats.mean_brightness === 'number'
            ? stats.mean_brightness.toFixed(2)
            : 'Unavailable';

      const contrast =
        typeof stats.contrast === 'number'
          ? stats.contrast.toFixed(2)
          : 'Unavailable';

      const dominantChannel =
        stats.dominant_channel ||
        'Unknown';

      const meanRed =
        typeof stats.mean_red === 'number'
          ? stats.mean_red.toFixed(2)
          : '—';

      const meanGreen =
        typeof stats.mean_green === 'number'
          ? stats.mean_green.toFixed(2)
          : '—';

      const meanBlue =
        typeof stats.mean_blue === 'number'
          ? stats.mean_blue.toFixed(2)
          : '—';

      addLabelValue(
        doc,
        'Dimensions',
        dimensions,
        18,
        y
      );

      addLabelValue(
        doc,
        'Format',
        format,
        78,
        y
      );

      addLabelValue(
        doc,
        'Channels',
        channels,
        130,
        y
      );

      y += 17;

      addLabelValue(
        doc,
        'Brightness',
        brightness,
        18,
        y
      );

      addLabelValue(
        doc,
        'Contrast',
        contrast,
        78,
        y
      );

      addLabelValue(
        doc,
        'Dominant channel',
        dominantChannel,
        130,
        y
      );

      y += 17;

      addLabelValue(
        doc,
        'Mean Red',
        meanRed,
        18,
        y
      );

      addLabelValue(
        doc,
        'Mean Green',
        meanGreen,
        78,
        y
      );

      addLabelValue(
        doc,
        'Mean Blue',
        meanBlue,
        130,
        y
      );

      y += 20;

      /*
       * ------------------------------------------------
       * MODEL INFORMATION
       * ------------------------------------------------
       */

      y = addSectionTitle(
        doc,
        '4. MODEL INFORMATION',
        y
      );

      const modelInfo =
        analysis.model_information || {};

      const fullName =
        modelInfo.full_name ||
        'Pix2Pix Conditional GAN';

      const task =
        modelInfo.task ||
        'SAR-to-Optical Image Translation';

      const pix2pixVersion =
        modelInfo.pix2pix_version ||
        'Pix2Pix Generator (pth)';

      const terrainModelInfo =
        modelInfo.terrain_model ||
        terrainModel;

      addLabelValue(
        doc,
        'Optical translation model',
        fullName,
        18,
        y
      );

      y += 14;

      addLabelValue(
        doc,
        'Model version',
        pix2pixVersion,
        18,
        y
      );

      addLabelValue(
        doc,
        'Terrain model',
        String(terrainModelInfo),
        105,
        y
      );

      y += 14;

      addLabelValue(
        doc,
        'Task',
        task,
        18,
        y
      );

      y += 20;

      /*
       * ------------------------------------------------
       * FOOTER
       * ------------------------------------------------
       */

      doc.setDrawColor(
        216,
        226,
        219
      );

      doc.line(
        14,
        pageHeight - 20,
        pageWidth - 14,
        pageHeight - 20
      );

      doc.setTextColor(
        113,
        128,
        120
      );

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(8);

      doc.text(
        'Generated by SAR Colourization using AI',
        14,
        pageHeight - 13
      );

      doc.text(
        `Scene ID: ${conversation.id}`,
        pageWidth - 14,
        pageHeight - 13,
        {
          align: 'right',
        }
      );

      /*
       * ------------------------------------------------
       * DOWNLOAD
       * ------------------------------------------------
       */

      const safeTitle =
        (conversation.title || 'SAR-Analysis')
          .replace(/[^a-z0-9-_]/gi, '-')
          .replace(/-+/g, '-');

      doc.save(
        `${safeTitle}-report.pdf`
      );

    } catch (error) {
      console.error(
        'PDF report generation failed:',
        error
      );

      alert(
        'Could not generate the PDF report. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generateReport}
      disabled={generating}
      className="inline-flex items-center gap-2 rounded-lg border border-[#C9DCD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#176344] shadow-sm transition hover:bg-[#F3F8F4] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}

      <span>
        {generating
          ? 'Generating...'
          : 'PDF Report'}
      </span>

      {!generating && (
        <Download className="w-3.5 h-3.5" />
      )}
    </button>
  );
};

export default ReportButton;