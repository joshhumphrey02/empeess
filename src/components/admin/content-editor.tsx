"use client";

import { IconArrowBackUp, IconLoader2, IconUpload } from "@tabler/icons-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { saveSiteContentAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContentField, ContentSection } from "@/lib/site-content";

import { useAdminAction } from "./use-admin-action";
import { discardUpload, useImageUpload } from "./use-image-upload";

type Entry = { value: string; arkId?: string | null };
type Values = Record<string, Entry>;

function ImageField({
  field,
  current,
  isDefault,
  alt,
  onChange,
  onAltChange,
  onReset,
}: {
  field: ContentField;
  current: string;
  isDefault: boolean;
  alt?: string;
  onChange: (entry: Entry) => void;
  onAltChange?: (value: string) => void;
  onReset: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload((img) => onChange({ value: img.url, arkId: img.arkAssetId }));
  const id = `content-${field.path}`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{field.label}</Label>
      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted">
        <Image src={current} alt="" fill sizes="(min-width: 1024px) 320px, 90vw" className="object-cover" />
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <IconLoader2 className="size-6 animate-spin" aria-label="Uploading" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload([file]);
            e.target.value = "";
          }}
        />
        <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => input.current?.click()}>
          <IconUpload /> {uploading ? "Uploading…" : "Replace photo"}
        </Button>
        {!isDefault && (
          <Button type="button" size="sm" variant="ghost" disabled={uploading} onClick={onReset}>
            <IconArrowBackUp /> Use original
          </Button>
        )}
      </div>
      {onAltChange && (
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-alt`} className="text-xs font-normal text-muted-foreground">
            Describe the photo (read aloud to visitors who can&apos;t see it)
          </Label>
          <Input id={`${id}-alt`} maxLength={160} value={alt ?? ""} onChange={(e) => onAltChange(e.target.value)} />
        </div>
      )}
    </div>
  );
}

/**
 * Edits storefront copy and photos. Everything is held locally until Save;
 * only the fields that changed are sent.
 */
export function ContentEditor({ sections, defaults, saved }: { sections: ContentSection[]; defaults: Record<string, string>; saved: Values }) {
  const { pending, run } = useAdminAction();
  const [edits, setEdits] = useState<Values>({});

  const stored = (path: string) => saved[path]?.value ?? defaults[path] ?? "";
  const current = (path: string) => edits[path]?.value ?? stored(path);
  const dirty = Object.keys(edits).filter((path) => edits[path]!.value !== stored(path));

  function set(path: string, entry: Entry) {
    setEdits((prev) => {
      // Replacing an upload that was never saved: let the server drop the old file.
      const old = prev[path]?.arkId;
      if (old && old !== entry.arkId && old !== saved[path]?.arkId) discardUpload(old);
      return { ...prev, [path]: entry };
    });
  }

  function save() {
    const changes = Object.fromEntries(dirty.map((path) => [path, edits[path]!]));
    run(() => saveSiteContentAction(changes), { onSuccess: () => setEdits({}) });
  }

  function discard() {
    for (const entry of Object.values(edits)) if (entry.arkId) discardUpload(entry.arkId);
    setEdits({});
  }

  return (
    <div className="grid gap-6 pb-24">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            {section.fields.map((field) => {
              const value = current(field.path);
              const isDefault = value === defaults[field.path];
              if (field.type === "image") {
                return (
                  <ImageField
                    key={field.path}
                    field={field}
                    current={value}
                    isDefault={isDefault}
                    alt={field.altPath ? current(field.altPath) : undefined}
                    onChange={(entry) => set(field.path, entry)}
                    onAltChange={field.altPath ? (alt) => set(field.altPath!, { value: alt }) : undefined}
                    onReset={() => set(field.path, { value: defaults[field.path] ?? "" })}
                  />
                );
              }
              const id = `content-${field.path}`;
              const Control = field.type === "textarea" ? Textarea : Input;
              return (
                <div key={field.path} className={field.type === "textarea" ? "grid content-start gap-2 sm:col-span-2 xl:col-span-1" : "grid content-start gap-2"}>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={id}>{field.label}</Label>
                    {!isDefault && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        onClick={() => set(field.path, { value: defaults[field.path] ?? "" })}
                      >
                        Use original
                      </button>
                    )}
                  </div>
                  <Control
                    id={id}
                    value={value}
                    maxLength={field.max}
                    {...(field.type === "textarea" ? { rows: 3 } : {})}
                    onChange={(e) => set(field.path, { value: e.target.value })}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {dirty.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border bg-popover px-4 py-2 text-sm shadow-lg">
          <span aria-live="polite">
            {dirty.length} unsaved {dirty.length === 1 ? "change" : "changes"}
          </span>
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={discard}>
            Discard
          </Button>
          <Button type="button" size="sm" disabled={pending} onClick={save}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
