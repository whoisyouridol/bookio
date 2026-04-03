import { useState, type ImgHTMLAttributes } from 'react';
import { resolveMediaUrl } from '@/api/media';

const FALLBACK = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIxIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjMuNyI+PHJlY3QgeD0iMTYiIHk9IjE2IiB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHJ4PSI2Ii8+PHBhdGggZD0ibTE2IDU4IDE2LTE4IDMyIDMyIi8+PGNpcmNsZSBjeD0iNTMiIGN5PSIzNSIgcj0iNyIvPjwvc3ZnPgo=';

export function ImageWithFallback(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [errored, setErrored] = useState(false);
  const { src, alt, className, style, ...rest } = props;

  const resolved = resolveMediaUrl(src);

  if (errored || !resolved) {
    return (
      <div className={`bg-[var(--color-bg-subtle)] flex items-center justify-center ${className ?? ''}`} style={style}>
        <img src={FALLBACK} alt="placeholder" className="w-12 h-12 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      style={style}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
