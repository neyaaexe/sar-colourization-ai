import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
  onUploadImage: (file: File) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onUploadImage,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-space-darkest via-space-darkest/95 to-transparent z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between bg-space-card/90 backdrop-blur-md border border-space-border hover:border-sar-purple/40 rounded-2xl px-5 py-3 shadow-[0_0_20px_rgba(3,0,20,0.8)] transition-all">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.tif,.tiff"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sar-deepPurple/30 text-sar-cyan border border-sar-purple/40">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wide font-sans">
              SAR Radar Image Upload
            </h4>
            <p className="text-[11px] text-gray-400 font-mono">
              Supported formats: PNG, JPG, JPEG, TIFF (Max 15MB)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs shadow-lg transition-all duration-200 ${
            disabled
              ? 'bg-space-darker text-gray-600 border border-space-border cursor-not-allowed'
              : 'bg-gradient-to-r from-sar-deepPurple to-sar-purple hover:from-sar-purple hover:to-sar-blue text-white shadow-[0_0_15px_rgba(157,78,221,0.4)] border border-sar-purple/40 hover:scale-105'
          }`}
        >
          <Upload className="w-4 h-4 text-sar-cyan" />
          <span>Upload New Image</span>
        </button>
      </div>
    </div>
  );
};
