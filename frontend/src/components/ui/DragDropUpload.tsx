import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { uploadMedia, deleteMedia, resolveMediaUrl } from '@/api/media';
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
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const replace = maxFiles === 1 && values.length >= 1;
    const remaining = replace ? 1 : maxFiles - values.length;
    if (remaining <= 0) {
      toast.error(t('components.dragDrop.maxFilesAllowed', { max: maxFiles }));
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const results = await Promise.all(toUpload.map(f => uploadMedia(f, folder)));
      if (replace) {
        // Delete old file(s) from storage before swapping reference
        await Promise.all(values.map(k => deleteMedia(k).catch(() => {})));
        onChange(results.map(r => r.key));
      } else {
        onChange([...values, ...results.map(r => r.key)]);
      }
    } catch {
      toast.error(t('components.dragDrop.uploadFailed'));
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
        className={`border-2 border-dashed rounded-[var(--radius-lg)] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
          dragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-hover)]'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-[var(--color-text-tertiary)]" />
        )}
        <p className="text-sm text-[var(--color-text-secondary)]">
          {uploading ? t('components.dragDrop.uploading') : t('components.dragDrop.dragAndDrop')}
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          {accept === 'image' && t('components.dragDrop.jpegPngWebpGif')}
          {accept === 'video' && t('components.dragDrop.mp4WebmMov')}
          {accept === 'image+video' && t('components.dragDrop.imagesAndVideos')}
          {maxFiles > 1 && ` · ${t('components.dragDrop.upToFiles', { max: maxFiles })}`}
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
            <div key={i} className="relative group w-20 h-20 rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
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
