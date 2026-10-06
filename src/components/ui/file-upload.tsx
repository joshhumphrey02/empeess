"use client";

// Adapted from Aceternity UI's File Upload
// (https://ui.aceternity.com/components/file-upload): same animated drop zone
// and grid, changed to accept several images, filter by type, and hand files
// to the caller (which uploads them and renders its own previews) instead of
// keeping an internal file list.

import { IconUpload } from "@tabler/icons-react";
import { motion } from "motion/react";
import React, { useRef } from "react";
import { useDropzone, type Accept } from "react-dropzone";

import { cn } from "@/lib/utils";

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const FileUpload = ({
  onChange,
  multiple = true,
  accept = { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"] },
  disabled = false,
  title = "Upload images",
  hint = "Drag and drop, or click to browse",
  className,
}: {
  onChange: (files: File[]) => void;
  multiple?: boolean;
  accept?: Accept;
  disabled?: boolean;
  title?: string;
  hint?: string;
  className?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, isDragActive } = useDropzone({
    multiple,
    accept,
    disabled,
    noClick: true,
    onDrop: (accepted) => accepted.length && onChange(accepted),
  });

  return (
    <div className={cn("w-full", className)} {...getRootProps()}>
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        whileHover={disabled ? undefined : "animate"}
        className={cn(
          "group/file relative block w-full cursor-pointer overflow-hidden rounded-xl border border-dashed p-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          isDragActive && "border-primary",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={Object.values(accept).flat().join(",")}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) onChange(files);
            e.target.value = "";
          }}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 text-sm font-semibold text-neutral-700 dark:text-neutral-300">{title}</p>
          <p className="relative z-20 mt-1 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>
          <div className="relative mx-auto mt-6 w-full max-w-xl">
            <motion.div
              layoutId="file-upload"
              variants={mainVariant}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "relative z-40 mx-auto flex h-20 w-full max-w-[6rem] items-center justify-center rounded-md bg-white group-hover/file:shadow-2xl dark:bg-neutral-900",
                "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]",
              )}
            >
              {isDragActive ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-xs text-neutral-600">
                  Drop it
                  <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </motion.p>
              ) : (
                <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
              )}
            </motion.div>
            <motion.div
              variants={secondaryVariant}
              className="absolute inset-0 z-30 mx-auto flex h-20 w-full max-w-[6rem] items-center justify-center rounded-md border border-dashed border-brand bg-transparent opacity-0"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-x-px gap-y-px bg-gray-100 dark:bg-neutral-900">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`flex h-10 w-10 shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:bg-neutral-950 dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        }),
      )}
    </div>
  );
}
