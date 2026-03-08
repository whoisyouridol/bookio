import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadMedia, resolveMediaUrl } from '@/api/media';
import { toast } from 'sonner';

type AcceptType = 'image' | 'video' | 'image+video';

interface Props {
  folder: string;
  accept?: AcceptType;
  maxFiles?: number;
  values: string[];
  onChange: (keys: string[]) => void;
}

const ACCEPT_MIME: Record<AcceptType, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif',
  video: 'video/mp4,video/webm,video/quicktime',
  'image+video': 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime',
};

function isVideoKey(key: string) {
  return /\.(mp4|webm|mov)$/i.test(key);
}

export function DragDropUpload({ folder, accept = 'image', maxFiles = 10, values, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const replace = maxFiles === 1 && values.length >= 1;
    const remaining = replace ? 1 : maxFiles - values.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxFiles} file(s) allowed.`);
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const results = await Promise.all(toUpload.map(f => uploadMedia(f, folder)));
      onChange(replace ? results.map(r => r.key) : [...values, ...results.map(r => r.key)]);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [folder, values, onChange, maxFiles]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  }, [handleFiles]);

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
          dragging
            ? 'border-purple-400 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-gray-400" />
        )}
        <p className="text-sm text-gray-500">
          {uploading ? 'Uploading…' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-gray-400">
          {accept === 'image' && 'JPEG, PNG, WEBP, GIF'}
          {accept === 'video' && 'MP4, WebM, MOV'}
          {accept === 'image+video' && 'Images & videos'}
          {maxFiles > 1 && ` · up to ${maxFiles} files`}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={ACCEPT_MIME[accept]}
          onChange={onInputChange}
          className="hidden"
        />
      </div>

      {/* Previews */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((key, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              {isVideoKey(key) ? (
                <video
                  src={resolveMediaUrl(key)}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <img
                  src={resolveMediaUrl(key)}
                  alt={`upload-${i}`}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
