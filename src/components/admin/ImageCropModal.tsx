"use client";

import Cropper from "react-easy-crop";
import { useCallback, useMemo, useState } from "react";
import type { Area } from "@/lib/imageCrop";
import { getCroppedBlob } from "@/lib/imageCrop";

type Props = {
  file: File;
  aspect?: number; // pvz 4/3 arba 1
  onCancel: () => void;
  onCropped: (result: { blob: Blob; previewUrl: string }) => void;
};

export function ImageCropModal({ file, aspect = 4 / 3, onCancel, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => URL.createObjectURL(file), [file]);

  const onCropComplete = useCallback((_area: any, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const confirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedBlob(preview, croppedAreaPixels, {
        mime: "image/jpeg",
        quality: 0.92,
      });

      const previewUrl = URL.createObjectURL(blob);
      onCropped({ blob, previewUrl });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold">Apkarpyti nuotrauką</div>
          <button onClick={onCancel} className="text-sm text-neutral-600 hover:text-neutral-900">
            Uždaryti
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative w-full bg-neutral-100 rounded-xl overflow-hidden" style={{ height: 420 }}>
            <Cropper
              image={preview}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-neutral-600">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-800 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Processing..." : "Save crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}