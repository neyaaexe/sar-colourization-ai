export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ImageItem {
  id: string;
  conversation_id: string;
  type: 'original_sar' | 'wflmgan_rgb' | 'mcgan_rgb' | 'pix2pix_rgb';
  file_path: string;
  meta_data?: Record<string, any>;
  created_at: string;
}

export interface TerrainAnalysisData {
  vegetation: number;
  water: number;
  urban: number;
  agriculture: number;
  confidence?: number;
  model?: string;
  device?: string;
  predicted_terrain?: string;
}

export interface ImageAnalysisData {
  dimensions?: string;
  channels?: string;
  file_format?: string;
  mean_brightness?: number;
  contrast?: number;
  dominant_colors?: string[];

  image_width?: number;
  image_height?: number;
  format?: string;
  brightness?: number;
  dominant_channel?: string;
  mean_red?: number;
  mean_green?: number;
  mean_blue?: number;
}

export interface ModelInfoData {
  pix2pix_version?: string;
  full_name?: string;
  task?: string;
  terrain_model?: string;
}

export interface AnalysisItem {
  id: string;
  conversation_id: string;
  terrain_analysis: TerrainAnalysisData;
  image_analysis: ImageAnalysisData;
  model_information: ModelInfoData;
  created_at: string;
}

export interface ConversationSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  images: ImageItem[];
  analyses: AnalysisItem[];
}

export interface ConversationSummary {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
