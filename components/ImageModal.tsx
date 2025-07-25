import React from 'react';
import NextImage from 'next/image';

export default function ImageModal({ src, onClose }: { src: string, onClose: () => void }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      style={{ cursor: 'zoom-out' }}
    >
      <NextImage
        src={src}
        alt="Large preview"
        width={800}
        height={600}
        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl border-4 border-white"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking the image itself
        unoptimized={src.startsWith('data:')}
      />
      <button
        className="absolute top-6 right-8 text-white text-3xl font-bold"
        onClick={onClose}
        aria-label="Close"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        &times;
      </button>
    </div>
  );
} 