import React, { useRef, useState } from 'react';
import { UploadCloud, X, Star, Loader2 } from 'lucide-react';
import { resizeImageToDataUrl } from '../../utils/validation';
import { useToast } from '../ui/Toast';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 5,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images.`);
      return;
    }

    setIsProcessing(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await resizeImageToDataUrl(file, 1024, 0.82);
        newUrls.push(dataUrl);
      } catch (err: any) {
        toast.error(err.message || `Failed to process image ${file.name}`);
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }
    setIsProcessing(false);
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, idx) => idx !== index);
    onChange(next);
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const filtered = images.filter((_, idx) => idx !== index);
    onChange([item, ...filtered]);
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500 font-medium">Compressing & optimizing images...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-slate-700">
                <span className="text-indigo-600 underline">Click to upload</span> or drag and drop
              </div>
              <p className="text-xs text-slate-400">
                JPG, PNG, or WebP up to 5 MB ({images.length}/{maxImages} uploaded)
              </p>
            </>
          )}
        </div>
      )}

      {/* Thumbnails preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 shadow-xs"
            >
              <img
                src={imgUrl}
                alt={`Upload preview ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Cover badge */}
              {index === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-white" />
                  Cover
                </div>
              )}

              {/* Action buttons */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(index)}
                    title="Make cover image"
                    className="p-1.5 bg-white text-slate-800 rounded-lg text-xs hover:bg-slate-100 transition-colors"
                  >
                    Set Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  title="Remove image"
                  className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
