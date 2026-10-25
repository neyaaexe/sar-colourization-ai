import React from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ConversationSession } from '../../types';
interface ReportChatMessage {
  id?: string;
  role: string;
  content: string;
  created_at?: string;
}
interface ReportButtonProps {
  conversation: ConversationSession;
}

interface LandCoverAnalysisData {
  model?: string;
  method?: string;
  percentages?: Record<string, number>;
  warning?: string;
  segmentation_map_url?: string;
}

interface ReportImageAnalysis {
  image_width?: number;
  image_height?: number;
  dimensions?: string;
  format?: string;
  file_format?: string;
  channels?: number | string;
  brightness?: number;
  mean_brightness?: number;
  contrast?: number;
  dominant_channel?: string;
  mean_red?: number;
  mean_green?: number;
  mean_blue?: number;
  land_cover_analysis?: LandCoverAnalysisData;
}

const API_BASE = 'http://127.0.0.1:8000';

const getImageUrl = (path?: string): string => {
  if (!path) return '';

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${API_BASE}${path}`;
  }

  return `${API_BASE}/${path}`;
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

      reader.onerror = () => reject(new Error('Could not read image'));

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load report image:', path, error);
    return null;
  }
};

const addSectionTitle = (
  doc: jsPDF,
  title: string,
  y: number
): number => {
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
): void => {
  doc.setTextColor(105, 123, 114);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(label, x, y);

  doc.setTextColor(18, 61, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  const lines = doc.splitTextToSize(value || 'Unavailable', 55);
  doc.text(lines, x, y + 5);
};

const addParagraph = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth = 174
): number => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 91, 82);

  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);

  return y + lines.length * 4.5;
};

const getImageFormat = (dataUrl: string): 'PNG' | 'JPEG' => {
  return dataUrl.startsWith('data:image/jpeg') ||
    dataUrl.startsWith('data:image/jpg')
    ? 'JPEG'
    : 'PNG';
};

export const ReportButton: React.FC<ReportButtonProps> = ({
  conversation,
}) => {
  const [generating, setGenerating] = React.useState(false);

  const generateReport = async () => {
    if (!conversation || generating) return;

    setGenerating(true);

    try {
      const analysis = conversation.analyses?.[0];

      if (!analysis) {
        alert('Analysis data is not available yet.');
        return;
      }
      // Fetch saved AI Assistant questions and answers.
let chatMessages: ReportChatMessage[] = [];

try {
  const token = localStorage.getItem('sar_token');

  const response = await fetch(
    `${API_BASE}/conversations/${conversation.id}/messages`,
    {
      method: 'GET',
      headers: {
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
    }
  );

  if (response.ok) {
    const data = await response.json();

    if (Array.isArray(data)) {
      chatMessages = data.filter(
        (message: ReportChatMessage) =>
          message &&
          typeof message.content === 'string' &&
          ['user', 'assistant'].includes(message.role)
      );
    }
  } else {
    console.warn(
      'Could not load saved chat messages:',
      response.status,
      await response.text()
    );
  }
} catch (error) {
  console.error(
    'Failed to fetch saved chat messages:',
    error
  );
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

      const [sarDataUrl, pix2pixDataUrl] = await Promise.all([
        loadImageAsDataUrl(sarImage?.file_path),
        loadImageAsDataUrl(pix2pixImage?.file_path),
      ]);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const left = 14;
      const right = 196;
      const bottomMargin = 20;

      let y = 18;

      // Start a new page whenever the next block will not fit.
      const ensureSpace = (requiredHeight: number) => {
        if (y + requiredHeight > pageHeight - bottomMargin) {
          doc.addPage();
          y = 20;
        }
      };

      // HEADER
      doc.setFillColor(11, 51, 37);
      doc.roundedRect(12, 12, pageWidth - 24, 30, 4, 4, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SAR Analysis Report', 20, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(205, 228, 215);
      doc.text(
        'SAR Colourization using AI | Earth Observation',
        20,
        33
      );

      y = 52;

      // SCENE INFORMATION
      doc.setTextColor(18, 61, 45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);

      const sceneTitle = doc.splitTextToSize(
        conversation.title || 'SAR Analysis',
        180
      );

      doc.text(sceneTitle, left, y);
      y += sceneTitle.length * 6 + 3;

      doc.setTextColor(105, 123, 114);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const analysisDate = new Date(
        analysis.created_at
      ).toLocaleString();

      doc.text(`Generated: ${analysisDate}`, left, y);
      y += 12;

      // IMAGE RESULTS
      y = addSectionTitle(doc, '1. IMAGE RESULTS', y);

      const imageWidth = 82;
      const imageHeight = 65;
      const imageY = y + 4;

      if (sarDataUrl) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(18, 61, 45);
        doc.text('Original SAR', 14, y);

        doc.addImage(
          sarDataUrl,
          getImageFormat(sarDataUrl),
          14,
          imageY,
          imageWidth,
          imageHeight,
          undefined,
          'FAST'
        );
      } else {
        addParagraph(doc, 'Original SAR image could not be loaded.', 14, y + 5, 82);
      }

      if (pix2pixDataUrl) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(18, 61, 45);
        doc.text('Optical Result', 108, y);

        doc.addImage(
          pix2pixDataUrl,
          getImageFormat(pix2pixDataUrl),
          108,
          imageY,
          imageWidth,
          imageHeight,
          undefined,
          'FAST'
        );
      } else {
        addParagraph(doc, 'Optical result image could not be loaded.', 108, y + 5, 82);
      }

      y += imageHeight + 15;

      // TERRAIN ANALYSIS
      ensureSpace(55);
      y = addSectionTitle(doc, '2. TERRAIN ANALYSIS', y);

      const terrain = analysis.terrain_analysis || {};

      const predictedTerrain =
        terrain.predicted_terrain || 'Unknown';

      const confidence =
        typeof terrain.confidence === 'number'
          ? `${terrain.confidence.toFixed(2)}%`
          : 'Unavailable';

      const terrainModel = terrain.model || 'EuroSAT-Swin';
      const device = terrain.device || 'Unknown';

      addLabelValue(doc, 'Predicted terrain', String(predictedTerrain), 18, y);
      addLabelValue(doc, 'Confidence', confidence, 78, y);
      addLabelValue(doc, 'Model', String(terrainModel), 138, y);

      y += 18;

      addLabelValue(doc, 'Processing device', String(device), 18, y);
      y += 18;

      // IMAGE STATISTICS
      ensureSpace(90);
      y = addSectionTitle(doc, '3. IMAGE STATISTICS', y);

      const stats = (analysis.image_analysis || {}) as ReportImageAnalysis;

      const dimensions =
        stats.image_width !== undefined &&
        stats.image_height !== undefined
          ? `${stats.image_width} × ${stats.image_height}`
          : stats.dimensions || 'Unknown';

      const format = stats.format || stats.file_format || 'Unknown';

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

      const dominantChannel = stats.dominant_channel || 'Unknown';

      const meanRed =
        typeof stats.mean_red === 'number'
          ? stats.mean_red.toFixed(2)
          : 'Unavailable';

      const meanGreen =
        typeof stats.mean_green === 'number'
          ? stats.mean_green.toFixed(2)
          : 'Unavailable';

      const meanBlue =
        typeof stats.mean_blue === 'number'
          ? stats.mean_blue.toFixed(2)
          : 'Unavailable';

      addLabelValue(doc, 'Dimensions', dimensions, 18, y);
      addLabelValue(doc, 'Format', format.toUpperCase(), 78, y);
      addLabelValue(doc, 'Channels', channels, 138, y);

      y += 18;

      addLabelValue(doc, 'Brightness', brightness, 18, y);
      addLabelValue(doc, 'Contrast', contrast, 78, y);
      addLabelValue(doc, 'Dominant channel', dominantChannel, 138, y);

      y += 18;

      addLabelValue(doc, 'Mean Red', meanRed, 18, y);
      addLabelValue(doc, 'Mean Green', meanGreen, 78, y);
      addLabelValue(doc, 'Mean Blue', meanBlue, 138, y);

      y += 20;

      // LAND COVER ANALYSIS
      const landCover = stats.land_cover_analysis;

      if (landCover?.percentages) {
        ensureSpace(90);
        y = addSectionTitle(doc, '4. LAND COVER ANALYSIS', y);

const categories = Object.entries(landCover.percentages)
  .filter(([, value]) => typeof value === 'number')
  .sort((a, b) => b[1] - a[1]);

if (categories.length === 0) {
  y = addParagraph(
    doc,
    'No land-cover percentage values were available.',
    18,
    y
  ) + 5;
}

for (const [key, percentage] of categories) {
  ensureSpace(12);

  const label = key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 91, 82);
  doc.text(label, 18, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 61, 45);
  doc.text(`${percentage.toFixed(2)}%`, 190, y, {
    align: 'right',
  });

  const barX = 18;
  const barY = y + 3;
  const barWidth = 172;
  const barHeight = 2;

  doc.setFillColor(237, 241, 237);
  doc.roundedRect(
    barX,
    barY,
    barWidth,
    barHeight,
    1,
    1,
    'F'
  );

  doc.setFillColor(61, 155, 98);

  const filledWidth =
    barWidth * Math.min(100, Math.max(0, percentage)) / 100;

  if (filledWidth > 0) {
    doc.roundedRect(
      barX,
      barY,
      filledWidth,
      barHeight,
      1,
      1,
      'F'
    );
  }

  y += 12;
}

        if (landCover.model) {
          ensureSpace(12);
          addLabelValue(
            doc,
            'Segmentation model',
            landCover.model,
            18,
            y
          );
          y += 15;
        }

        if (landCover.method) {
          ensureSpace(12);
          addLabelValue(
            doc,
            'Analysis method',
            landCover.method,
            18,
            y
          );
          y += 15;
        }

        if (landCover.warning) {
          const warningLines = doc.splitTextToSize(
            `Model limitation: ${landCover.warning}`,
            174
          );

          const warningHeight = warningLines.length * 4.5 + 8;
          ensureSpace(warningHeight);

          doc.setFillColor(255, 248, 230);
          doc.setDrawColor(235, 210, 155);
          doc.roundedRect(
            14,
            y - 4,
            182,
            warningHeight,
            2,
            2,
            'FD'
          );

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(120, 85, 30);
          doc.text(warningLines, 18, y + 1);

          y += warningHeight + 4;
        }

        // SEGMENTATION MAP
        if (landCover.segmentation_map_url) {
          const segmentationDataUrl = await loadImageAsDataUrl(
            landCover.segmentation_map_url
          );

          if (segmentationDataUrl) {
            ensureSpace(90);

            y = addSectionTitle(doc, 'SEGMENTATION MAP', y);

            const props = doc.getImageProperties(segmentationDataUrl);

            const maxWidth = 170;
            const maxHeight = 85;
            const scale = Math.min(
              maxWidth / props.width,
              maxHeight / props.height
            );

            const renderedWidth = props.width * scale;
            const renderedHeight = props.height * scale;

            ensureSpace(renderedHeight + 5);

            doc.addImage(
              segmentationDataUrl,
              getImageFormat(segmentationDataUrl),
              20,
              y,
              renderedWidth,
              renderedHeight,
              undefined,
              'FAST'
            );

            y += renderedHeight + 8;
          } else {
            ensureSpace(15);
            y = addParagraph(
              doc,
              'The segmentation map could not be loaded for inclusion in this report.',
              18,
              y
            ) + 5;
          }
        }
      } else {
        ensureSpace(20);
        y = addSectionTitle(doc, '4. LAND COVER ANALYSIS', y);
        y = addParagraph(
          doc,
          'Land-cover analysis was not available in the analysis data used to generate this report.',
          18,
          y
        ) + 5;
      }
      // AI ASSISTANT Q&A
ensureSpace(35);
y = addSectionTitle(doc, '5. AI ASSISTANT Q&A', y);

if (chatMessages.length === 0) {
  y = addParagraph(
    doc,
    'No saved AI Assistant questions or answers were available for this conversation.',
    18,
    y
  ) + 8;
} else {
  for (const message of chatMessages) {
    const isUser = message.role === 'user';
    const label = isUser ? 'User Question' : 'AI Assistant Answer';

    const contentLines = doc.splitTextToSize(
      message.content,
      166
    );

    const blockHeight = contentLines.length * 4.5 + 15;

    ensureSpace(Math.min(blockHeight, 35));

    // Recalculate the available space after a page break.
    const actualHeight = contentLines.length * 4.5 + 15;
    ensureSpace(actualHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(
      isUser ? 23 : 18,
      isUser ? 99 : 61,
      isUser ? 68 : 45
    );

    doc.text(label, 18, y);

    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 91, 82);

    doc.text(contentLines, 18, y);

    y += contentLines.length * 4.5 + 7;
  }
}
      // MODEL INFORMATION
      ensureSpace(65);
      y = addSectionTitle(doc, '6. MODEL INFORMATION', y);

      const modelInfo = analysis.model_information || {};

      const fullName =
        modelInfo.full_name || 'Pix2Pix Conditional GAN';

      const task =
        modelInfo.task || 'SAR-to-Optical Image Translation';

      const pix2pixVersion =
        modelInfo.pix2pix_version || 'Pix2Pix Generator';

      const terrainModelInfo =
        modelInfo.terrain_model || terrainModel;

      addLabelValue(doc, 'Optical translation model', String(fullName), 18, y);
      y += 16;

      addLabelValue(doc, 'Model version', String(pix2pixVersion), 18, y);
      addLabelValue(doc, 'Terrain model', String(terrainModelInfo), 105, y);
      y += 16;

      ensureSpace(20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(105, 123, 114);
      doc.text('Task', 18, y);

      doc.setTextColor(18, 61, 45);
      doc.setFont('helvetica', 'bold');

      const taskLines = doc.splitTextToSize(String(task), 170);
      doc.text(taskLines, 18, y + 5);

      y += taskLines.length * 5 + 15;

      // FOOTERS ON ALL PAGES
      const pageCount = doc.getNumberOfPages();

      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);

        doc.setDrawColor(216, 226, 219);
        doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

        doc.setTextColor(113, 128, 120);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        doc.text(
          'Generated by SAR Colourization using AI',
          14,
          pageHeight - 13
        );

        doc.text(
          `Page ${page} of ${pageCount}`,
          pageWidth - 14,
          pageHeight - 13,
          { align: 'right' }
        );
      }

      // DOWNLOAD
      const safeTitle = (conversation.title || 'SAR-Analysis')
        .replace(/[^a-z0-9-_]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      doc.save(`${safeTitle || 'SAR-Analysis'}-report.pdf`);
    } catch (error) {
      console.error('PDF report generation failed:', error);

      alert(
        'Could not generate the PDF report. Check the browser console for details and try again.'
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

      <span>{generating ? 'Generating...' : 'PDF Report'}</span>

      {!generating && <Download className="w-3.5 h-3.5" />}
    </button>
  );
};

export default ReportButton;