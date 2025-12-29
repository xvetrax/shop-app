// src/lib/imageCrop.ts
export type Area = { width: number; height: number; x: number; y: number };

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    image.setAttribute("crossOrigin", "anonymous"); // svarbu jei kada bus URL
    image.src = url;
  });
}

export async function getCroppedBlob(
  imageSrc: string,
  crop: Area,
  opts?: { mime?: string; quality?: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  canvas.width = Math.round(crop.width);
  canvas.height = Math.round(crop.height);

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const mime = opts?.mime ?? "image/jpeg";
  const quality = opts?.quality ?? 0.9;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to create blob"));
        resolve(blob);
      },
      mime,
      quality
    );
  });
}