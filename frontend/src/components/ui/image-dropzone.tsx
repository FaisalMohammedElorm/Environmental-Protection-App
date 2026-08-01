"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

interface ImageDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
  maxFiles?: number;
}

export function ImageDropzone({ files, onChange, error, maxFiles = 5 }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const merged = [...files, ...incoming].slice(0, maxFiles);
    onChange(merged);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-canopy-700 dark:text-canopy-200">Photos</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-canopy-200 dark:border-canopy-600 bg-mist/40 dark:bg-canopy-800/40 px-6 py-8 text-center transition-colors hover:border-moss"
      >
        <ImagePlus className="h-6 w-6 text-canopy-400 dark:text-canopy-500" strokeWidth={1.75} />
        <p className="mt-2 text-sm font-medium text-canopy-600 dark:text-canopy-300">Drag photos here, or click to browse</p>
        <p className="text-xs text-canopy-400 dark:text-canopy-500">Up to {maxFiles} photos, JPG or PNG</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-canopy-100 dark:border-canopy-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload preview ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-canopy-800/80 text-paper"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs font-medium text-alert-clay">{error}</p>}
    </div>
  );
}
