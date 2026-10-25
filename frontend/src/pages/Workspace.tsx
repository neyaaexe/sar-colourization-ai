
import React from 'react';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Database,
  Sparkles,
  Layers3,
  BarChart3,
  ChevronRight,
  MessageCircle,
  Send,
  Bot,
  User,
  AlertCircle,
} from 'lucide-react';

import { conversationsAPI } from '../services/api';

import {
  ConversationSession,
  ConversationSummary,
  ImageItem,
} from '../types';

import { ImageComparison } from '../components/analysis/ImageComparison';
import { TerrainAnalysis } from '../components/analysis/TerrainAnalysis';
import { ImageAnalysis } from '../components/analysis/ImageAnalysis';
import LandCoverAnalysis from '../components/analysis/LandCoverAnalysis';
import LandCoverInterpretation from '../components/analysis/LandCoverInterpretation';
import { ReportButton } from '../components/analysis/ReportButton';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { ProcessingMessage } from '../components/chat/ProcessingMessage';

interface LandCoverData {
  model?: string;
  method?: string;
  percentages?: Record<string, number>;
  pixel_counts?: Record<string, number>;
  total_pixels?: number;
  warning?: string;
  segmentation_map_url?: string;
}

interface ImageAnalysisWithLandCover {
  land_cover_analysis?: LandCoverData;
  [key: string]: unknown;
}

export const Workspace: React.FC = () => {
  const [currentSession, setCurrentSession] =
    React.useState<ConversationSession | null>(null);

  const [conversations, setConversations] =
    React.useState<ConversationSummary[]>([]);

  const [processingStage, setProcessingStage] =
    React.useState<number | null>(null);

  const [isDragging, setIsDragging] = React.useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = React.useState('');
  const [isChatSending, setIsChatSending] = React.useState(false);
  const [chatError, setChatError] = React.useState('');

  React.useEffect(() => {
    setChatMessages([]);
    setChatInput('');
    setChatError('');
  }, [currentSession?.id]);

  // Load workspace
  React.useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      try {
        const list = await conversationsAPI.getAll();

        if (cancelled) return;

        setConversations(list);

        if (list.length > 0) {
          const session = await conversationsAPI.getById(list[0].id);

          if (!cancelled) {
            setCurrentSession(session);
          }
        } else {
          const session = await conversationsAPI.create('New Analysis');

          if (!cancelled) {
            setCurrentSession(session);
            setConversations(await conversationsAPI.getAll());
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[Workspace] Failed to load:', error);
        }
      }
    };

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  // Select scene
  const handleSelectConversation = async (id: string) => {
    try {
      const session = await conversationsAPI.getById(id);
      setCurrentSession(session);
      setProcessingStage(null);
    } catch (error) {
      console.error('[Workspace] Failed to load scene:', error);
    }
  };

  // New scene
  const handleNewAnalysis = async () => {
    try {
      const session = await conversationsAPI.create('New Analysis');

      setCurrentSession(session);
      setProcessingStage(null);
      setConversations(await conversationsAPI.getAll());
    } catch (error) {
      console.error('[Workspace] Failed to create scene:', error);
    }
  };
  // Rename scene
const handleRenameConversation = async (
  id: string,
  currentTitle: string
) => {
  const proposedTitle = window.prompt(
    'Enter a new scene name:',
    currentTitle
  );

  if (proposedTitle === null) return;

  const title = proposedTitle.trim();

  if (!title) {
    window.alert('Scene name cannot be empty.');
    return;
  }

  if (title.length > 120) {
    window.alert('Scene name cannot exceed 120 characters.');
    return;
  }

  try {
    await conversationsAPI.rename(id, title);

    const updatedList = await conversationsAPI.getAll();
    setConversations(updatedList);

    if (currentSession?.id === id) {
      const updatedSession = await conversationsAPI.getById(id);
      setCurrentSession(updatedSession);
    }
  } catch (error) {
    console.error('[Workspace] Failed to rename scene:', error);
    window.alert('Could not rename this scene. Please try again.');
  }
};
  // Delete scene
  const handleDeleteConversation = async (id: string) => {
    try {
      await conversationsAPI.delete(id);

      const list = await conversationsAPI.getAll();
      setConversations(list);

      if (currentSession?.id === id) {
        if (list.length > 0) {
          setCurrentSession(await conversationsAPI.getById(list[0].id));
        } else {
          const session = await conversationsAPI.create('New Analysis');

          setCurrentSession(session);
          setConversations(await conversationsAPI.getAll());
        }
      }
    } catch (error) {
      console.error('[Workspace] Failed to delete scene:', error);
    }
  };

  // Upload and process image
  const handleUploadImage = async (file: File) => {
    if (!currentSession) return;

    try {
      setProcessingStage(1);

      await conversationsAPI.uploadImage(currentSession.id, file);

      setProcessingStage(2);

      const processed = await conversationsAPI.processImage(
        currentSession.id
      );

      setProcessingStage(3);
      setCurrentSession(processed);

      setProcessingStage(4);

      await new Promise((resolve) => setTimeout(resolve, 700));

      setConversations(await conversationsAPI.getAll());
    } catch (error: unknown) {
      console.error('[Workspace] Processing failed:', error);

      const apiError = error as {
        response?: {
          data?: {
            detail?: string;
          };
        };
      };

      alert(
        apiError.response?.data?.detail ||
          'Failed to upload or process the SAR image.'
      );
    } finally {
      setProcessingStage(null);
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      void handleUploadImage(file);
    }

    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void handleUploadImage(file);
    }
  };


  const handleSendChatMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || !currentSession || isChatSending) return;
    if (!hasResults) {
      setChatError('Upload and process a SAR image before asking questions.');
      return;
    }

    setChatMessages((messages) => [...messages, {
      id: `user-${Date.now()}`, role: 'user', content: question
    }]);
    setChatInput('');
    setChatError('');
    setIsChatSending(true);

    try {
      const token = localStorage.getItem('sar_token');
      const response = await fetch(`/conversations/${currentSession.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: question }),
      });
      console.log("CHAT STATUS:", response.status);
console.log("CHAT ERROR:", await response.clone().text());
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data?.detail === 'string'
          ? data.detail
          : 'The assistant could not answer. Please try again.');
      }

      const answer =
        (typeof data?.content === 'string' && data.content) ||
        (typeof data?.answer === 'string' && data.answer) ||
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.message?.content === 'string' && data.message.content) ||
        '';
      if (!answer) throw new Error('The server returned an empty answer. Check the chat endpoint response.');

      setChatMessages((messages) => [...messages, {
        id: `assistant-${Date.now()}`, role: 'assistant', content: answer
      }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not connect to the assistant.');
    } finally {
      setIsChatSending(false);
    }
  };

  // Current images
  const originalSar = currentSession?.images?.find(
    (image: ImageItem) => image.type === 'original_sar'
  );

  const pix2pixImage = currentSession?.images
    ?.filter((image: ImageItem) => image.type === 'pix2pix_rgb')
    ?.sort(
      (a: ImageItem, b: ImageItem) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )[0];

  const latestAnalysis = currentSession?.analyses?.length
    ? currentSession.analyses[currentSession.analyses.length - 1]
    : undefined;

  // Safely access the nested land-cover data without changing the shared API type.
  const imageAnalysisData = latestAnalysis?.image_analysis as
    | ImageAnalysisWithLandCover
    | undefined;

  const landCoverData = imageAnalysisData?.land_cover_analysis;

  // Debug output: use the safely accessed variable to avoid TS2339.
  React.useEffect(() => {
    console.log('[Land Cover Debug]', landCoverData);
  }, [landCoverData]);

  const getImageUrl = (image?: ImageItem) => {
    if (!image?.file_path) return '';

    if (
      image.file_path.startsWith('http://') ||
      image.file_path.startsWith('https://')
    ) {
      return image.file_path;
    }

    return image.file_path;
  };

  const originalSarUrl = getImageUrl(originalSar);
  const pix2pixRgbUrl = getImageUrl(pix2pixImage);

  const hasResults = Boolean(
    originalSarUrl && pix2pixRgbUrl && latestAnalysis
  );

  const imageMeta = originalSar?.meta_data as
    | Record<string, unknown>
    | undefined;

  const fileSize =
    typeof imageMeta?.size_bytes === 'number'
      ? `${(imageMeta.size_bytes / 1024 / 1024).toFixed(1)} MB`
      : '—';

  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#10271F]">
      <div className="flex min-h-screen">
        <Sidebar
          conversations={conversations}
          activeConversationId={currentSession?.id || null}
          onSelectConversation={handleSelectConversation}
          onNewAnalysis={handleNewAnalysis}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen((value) => !value)}
        />

        <div className="flex-1 min-w-0">
          <Header isWorkspace />

          <main className="px-5 sm:px-8 lg:px-10 py-8 max-w-[1500px] mx-auto">
            {/* Page heading */}
            <section className="grid xl:grid-cols-[1fr_0.72fr] gap-7 items-stretch mb-7">
              <div className="flex flex-col justify-center">
                <p className="text-sm font-semibold text-[#32815C] tracking-wide">
                  SAR ANALYSIS WORKSTATION
                </p>

                <h1 className="mt-3 text-4xl lg:text-5xl font-bold tracking-[-0.035em] text-[#0B3325]">
                  Turn SAR into insight.
                </h1>

                <p className="mt-4 text-base lg:text-lg leading-7 text-[#6B8279] max-w-2xl">
                  Upload a Sentinel-1 SAR image to generate an optical-like
                  representation and analyse its terrain characteristics using AI.
                </p>
              </div>

              <div className="relative min-h-[190px] overflow-hidden rounded-xl bg-[#174A35]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#559A69] via-[#205C40] to-[#0B3022]" />

                <div className="absolute inset-0 opacity-70">
                  <div className="absolute w-[500px] h-[180px] rounded-[50%] bg-[#79A966] -left-24 top-10 rotate-[-12deg]" />
                  <div className="absolute w-[420px] h-[130px] rounded-[50%] bg-[#315F43] left-44 bottom-3 rotate-[9deg]" />
                  <div className="absolute w-[55px] h-[420px] rounded-full bg-[#2F91A2] left-[54%] -top-32 rotate-[42deg]" />
                  <div className="absolute w-[280px] h-[100px] rounded-[50%] bg-[#9DBB79] right-[-70px] top-8 rotate-[10deg]" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#092318]/80 to-transparent" />

                <div className="absolute bottom-6 left-7 text-white">
                  <p className="text-[11px] tracking-[0.25em] font-semibold text-[#C9E0D0]">
                    SENTINEL-1
                  </p>
                  <p className="text-xl font-bold mt-2">Better imagery.</p>
                  <p className="text-xl font-bold text-[#BBDCC5]">
                    Deeper insights.
                  </p>
                </div>
              </div>
            </section>

            {/* Upload and pipeline */}
            <section className="grid xl:grid-cols-[1.05fr_0.95fr] gap-5 mb-6">
              {!hasResults && (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`bg-white border rounded-xl min-h-[290px] flex flex-col items-center justify-center text-center px-6 transition ${
                    isDragging
                      ? 'border-[#3B9A67] bg-[#F1F8F3]'
                      : 'border-[#D3E1D8]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#E3F0E7] flex items-center justify-center mb-5">
                    <Upload className="w-7 h-7 text-[#176344]" />
                  </div>

                  <h2 className="text-2xl font-bold text-[#103729]">
                    Upload SAR Image
                  </h2>

                  <p className="text-sm text-[#738A80] mt-2">
                    Drag &amp; drop your Sentinel-1 image here, or click to browse
                  </p>

                  <label className="mt-6 cursor-pointer">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.tif,.tiff"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <span className="green-button inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-sm">
                      <Upload className="w-4 h-4" />
                      Choose File
                    </span>
                  </label>

                  <p className="text-xs text-[#8CA097] mt-5">
                    PNG, JPG, JPEG, TIFF <span className="mx-2">|</span> Max size: 15 MB
                  </p>
                </div>
              )}

              {/* Processing pipeline */}
              <div className="bg-white border border-[#D3E1D8] rounded-xl p-6">
                <div className="flex items-center justify-between mb-7">
                  <div>
                    <h2 className="text-xl font-bold text-[#123A2A]">
                      Processing Pipeline
                    </h2>
                    <p className="text-sm text-[#80958C] mt-1">
                      From radar input to analysis
                    </p>
                  </div>

                  <span className="text-sm text-[#70887D]">4 stages</span>
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {[
                    { icon: Database, title: 'Input', text: 'SAR Image' },
                    { icon: Sparkles, title: 'Pix2Pix', text: 'Optical Translation' },
                    { icon: Layers3, title: 'Terrain', text: 'Classification' },
                    { icon: BarChart3, title: 'Metrics', text: 'Image Analysis' },
                  ].map((step, index) => {
                    const Icon = step.icon;

                    return (
                      <React.Fragment key={step.title}>
                        <div className="text-center">
                          <div
                            className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                              index === 0
                                ? 'bg-[#DDEFE3] text-[#258052]'
                                : index === 3
                                ? 'bg-[#DDF1F4] text-[#2D92A7]'
                                : 'bg-[#DCEFE6] text-[#329365]'
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>

                          <p className="mt-3 text-sm font-bold text-[#173D2D]">
                            {index + 1}. {step.title}
                          </p>

                          <p className="text-[11px] text-[#81958C] mt-1 leading-4">
                            {step.text}
                          </p>
                        </div>

                        {index < 3 && (
                          <div className="flex items-start justify-center pt-6">
                            <ArrowRight className="w-4 h-4 text-[#A4B7AD]" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Processing status */}
            {processingStage !== null && (
              <section className="bg-white border border-[#D3E1D8] rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-5">
                  {processingStage >= 4 ? (
                    <CheckCircle2 className="w-6 h-6 text-[#2E925C]" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-[#328F62] animate-spin" />
                  )}

                  <div>
                    <h2 className="text-xl font-bold text-[#123A2A]">
                      {processingStage >= 4
                        ? 'Analysis complete'
                        : 'Processing your image'}
                    </h2>

                    <p className="text-sm text-[#7B9087] mt-1">
                      Running the SAR analysis pipeline
                    </p>
                  </div>
                </div>

                <ProcessingMessage currentStage={processingStage} />
              </section>
            )}

            {/* Empty workspace */}
            {!hasResults && processingStage === null && (
              <section className="grid lg:grid-cols-[0.8fr_1.35fr_0.8fr] gap-5">
                <div className="bg-white border border-[#D3E1D8] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-[#173D2D]">
                      Recent Scenes
                    </h2>

                    <span className="text-xs font-semibold text-[#32815C]">
                      {conversations.length} total
                    </span>
                  </div>

                  <div className="space-y-2">
                    {conversations.slice(0, 4).map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() =>
                          handleSelectConversation(conversation.id)
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#F2F7F3] text-left transition"
                      >
                        <div className="w-12 h-12 rounded-lg bg-[#E3EFE6] flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-[#438763]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#173D2D] truncate">
                            {conversation.title || 'SAR Analysis'}
                          </p>

                          <p className="text-xs text-[#82968D] mt-1">
                            {new Date(
                              conversation.updated_at
                            ).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#9AAEA5]" />
                      </button>
                    ))}

                    {conversations.length === 0 && (
                      <p className="text-sm text-[#82968D] py-6 text-center">
                        No scenes yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-[#EEF5EF] border border-[#D5E4D9] rounded-xl min-h-[360px] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                  <div className="absolute right-[-70px] bottom-[-70px] w-72 h-72 rounded-full border border-[#C8DDD0]" />
                  <div className="absolute right-[-30px] bottom-[-30px] w-56 h-56 rounded-full border border-[#C8DDD0]" />

                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white border border-[#D5E4D9] flex items-center justify-center mx-auto">
                      <ImageIcon className="w-7 h-7 text-[#317B58]" />
                    </div>

                    <h2 className="text-2xl font-bold text-[#143A2A] mt-5">
                      Analysis Results
                    </h2>

                    <p className="text-sm leading-6 text-[#758D82] max-w-sm mt-3">
                      Upload a SAR image and run the analysis pipeline to see
                      your generated imagery and terrain results here.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#D3E1D8] rounded-xl overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-[#709C68] via-[#3E7650] to-[#16422F] relative">
                    <div className="absolute inset-0 opacity-70">
                      <div className="absolute w-52 h-20 rounded-full bg-[#91B87B] -left-8 top-5 rotate-[-12deg]" />
                      <div className="absolute w-56 h-14 rounded-full bg-[#2D6747] right-[-30px] bottom-4 rotate-[8deg]" />
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="text-lg font-bold text-[#173D2D]">
                      What You&apos;ll Get
                    </h2>

                    <div className="space-y-5 mt-5">
                      {[
                        {
                          icon: ImageIcon,
                          title: 'Colorized Optical Image',
                          text: 'Pix2Pix generated representation of your SAR image.',
                        },
                        {
                          icon: Layers3,
                          title: 'Terrain Classification',
                          text: 'Terrain prediction using EuroSAT-Swin.',
                        },
                        {
                          icon: BarChart3,
                          title: 'Image Statistics',
                          text: 'Pixel-level image measurements and metrics.',
                        },
                        {
                          icon: Database,
                          title: 'Land Cover Analysis',
                          text: 'Estimated water, vegetation, bare land and built-up areas.',
                        },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <div className="flex gap-3" key={item.title}>
                            <div className="w-9 h-9 rounded-full bg-[#DDF0E2] flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-[#32865A]" />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-[#214738]">
                                {item.title}
                              </p>

                              <p className="text-xs leading-5 text-[#7C9188] mt-1">
                                {item.text}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Results */}
            {hasResults && currentSession && (
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#32815C]">
                      ANALYSIS RESULTS
                    </p>

                    <h2 className="text-3xl font-bold text-[#103729] mt-2">
                      {currentSession.title || 'SAR Analysis'}
                    </h2>

                    <p className="text-sm text-[#789087] mt-2">
                      Generated from your uploaded Sentinel-1 SAR image.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <ReportButton conversation={currentSession} />

                    <div className="inline-flex items-center gap-2 bg-[#E1F1E5] text-[#247247] px-4 py-2 rounded-full text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Complete
                    </div>
                  </div>
                </div>

                {/* Image comparison */}
                <div className="bg-white border border-[#D3E1D8] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-bold text-[#173D2D]">
                        SAR → Optical
                      </h3>

                      <p className="text-sm text-[#81958C] mt-1">
                        Original radar image and generated optical representation.
                      </p>
                    </div>

                    <span className="hidden sm:block text-xs text-[#7B9188]">
                      Pix2Pix
                    </span>
                  </div>

                  <ImageComparison
                    originalSarUrl={originalSarUrl}
                    pix2pixRgbUrl={pix2pixRgbUrl}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {[
                      { label: 'Source', value: 'Sentinel-1' },
                      {
                        label: 'Format',
                        value:
                          typeof imageMeta?.format === 'string'
                            ? imageMeta.format
                            : 'Image',
                      },
                      { label: 'Size', value: fileSize },
                      { label: 'Model', value: 'Pix2Pix' },
                    ].map((item) => (
                      <div
                        className="bg-[#F3F7F4] rounded-lg p-3"
                        key={item.label}
                      >
                        <p className="text-[10px] uppercase tracking-wide text-[#82978E]">
                          {item.label}
                        </p>

                        <p className="text-sm font-semibold text-[#214738] mt-1">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terrain and image statistics */}
                {latestAnalysis && (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {latestAnalysis.terrain_analysis && (
                      <div className="bg-white border border-[#D3E1D8] rounded-xl p-5">
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-[#32815C]">
                            TERRAIN
                          </p>

                          <h3 className="text-xl font-bold text-[#173D2D] mt-1">
                            Terrain Classification
                          </h3>
                        </div>

                        <TerrainAnalysis
                          data={latestAnalysis.terrain_analysis}
                        />
                      </div>
                    )}

                    {latestAnalysis.image_analysis && (
                      <div className="bg-white border border-[#D3E1D8] rounded-xl p-5">
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-[#32815C]">
                            IMAGE DATA
                          </p>

                          <h3 className="text-xl font-bold text-[#173D2D] mt-1">
                            Image Statistics
                          </h3>
                        </div>

                        <ImageAnalysis
                          data={latestAnalysis.image_analysis}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Land cover analysis */}
                <div className="bg-white border border-[#D3E1D8] rounded-xl p-5">
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-[#32815C]">
                      LAND COVER
                    </p>

                    <h3 className="text-xl font-bold text-[#173D2D] mt-1">
                      Land Cover Analysis
                    </h3>

                    <p className="text-sm text-[#81958C] mt-1">
                      Estimated distribution and segmentation of land-cover categories.
                    </p>
                  </div>

                  {landCoverData?.percentages ? (
                    <LandCoverAnalysis data={landCoverData} />
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm text-amber-900">
                        Land-cover data was not found in the loaded analysis response.
                      </p>

                      <p className="text-xs text-amber-800 mt-2">
                        Check the browser console for the [Land Cover Debug]
                        output and verify the API response.
                      </p>
                    </div>
                  )}
                </div>
                  {/* Natural-language land-cover interpretation */}
                <LandCoverInterpretation data={landCoverData} />
                {/* Upload another */}
                {processingStage === null && (
                  <div className="flex justify-center pt-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.tif,.tiff"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <span className="outline-button inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold">
                        <Upload className="w-4 h-4" />
                        Analyse another SAR image
                      </span>
                    </label>
                  </div>
                )}
              </section>
            )}

            {/* SAR AI Assistant */}
            <section className="mt-8 bg-white border border-[#D3E1D8] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E2EBE5] bg-[#F7FAF7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#DDF0E2] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#26784D]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#173D2D]">SAR AI Assistant</h2>
                    <p className="text-xs text-[#7B9087] mt-0.5">Ask about the current image and its analysis results</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#32815C] bg-[#E7F4EA] px-3 py-1.5 rounded-full">
                  <MessageCircle className="w-3.5 h-3.5" /> Image Q&amp;A
                </span>
              </div>

              <div className="p-4 sm:p-5">
                {!hasResults && (
                  <div className="mb-4 rounded-lg border border-[#E2EBE5] bg-[#F8FAF8] p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-[#7B9087] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#71857B]">Upload and process a SAR image first. Then you can ask the assistant about the image and the available analysis.</p>
                  </div>
                )}

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {chatMessages.length === 0 && (
                    <div className="py-7 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#EAF4EC] flex items-center justify-center mx-auto">
                        <MessageCircle className="w-5 h-5 text-[#32815C]" />
                      </div>
                      <p className="text-sm font-semibold text-[#315342] mt-3">Ask a question about your analysis</p>
                      <p className="text-xs text-[#81958C] mt-1">Try: “What terrain was predicted?” or “Explain the image statistics.”</p>
                    </div>
                  )}

                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-[#DDF0E2] flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-[#26784D]" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap break-words ${
                        message.role === 'user'
                          ? 'bg-[#176344] text-white rounded-br-sm'
                          : 'bg-[#F1F6F2] text-[#254637] border border-[#E1EBE3] rounded-bl-sm'
                      }`}>{message.content}</div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-[#E8EEE9] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#557064]" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isChatSending && (
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-[#DDF0E2] flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-[#26784D]" />
                      </div>
                      <div className="rounded-xl rounded-bl-sm bg-[#F1F6F2] border border-[#E1EBE3] px-4 py-3 text-sm text-[#71857B]">Thinking about your image…</div>
                    </div>
                  )}
                </div>

                {chatError && <p role="alert" className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{chatError}</p>}

                <form onSubmit={handleSendChatMessage} className="mt-5 flex items-end gap-3">
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    disabled={!hasResults || isChatSending}
                    placeholder={hasResults ? 'Ask something about this SAR image…' : 'Process an image to enable chat…'}
                    rows={2}
                    className="min-h-[48px] flex-1 resize-y rounded-lg border border-[#D3E1D8] bg-white px-4 py-3 text-sm text-[#173D2D] outline-none focus:border-[#32815C] focus:ring-2 focus:ring-[#32815C]/10 disabled:bg-[#F4F6F4] disabled:text-[#9AA9A1]"
                  />
                  <button type="submit" disabled={!hasResults || !chatInput.trim() || isChatSending} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#176344] px-4 sm:px-5 text-sm font-semibold text-white transition hover:bg-[#104D34] disabled:cursor-not-allowed disabled:opacity-50">
                    {isChatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
                <p className="mt-2 text-[11px] text-[#91A198]">Enter to send · Shift+Enter for a new line</p>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
