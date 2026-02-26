import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCw, Check, X } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  aspect: number;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation: number = 0): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const rotRad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) throw new Error("No 2d context");

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.95
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

export default function ImageCropper({ imageSrc, aspect, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropCompleteHandler = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedBlob);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-white/70"
            data-testid="button-crop-cancel"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-sm md:text-base font-medium text-white/90 lowercase">ajustar imagem</h2>
        </div>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className="rounded-full bg-primary text-primary-foreground px-6 lowercase"
          data-testid="button-crop-confirm"
        >
          <Check className="h-4 w-4 mr-2" />
          {saving ? "processando..." : "aplicar"}
        </Button>
      </div>

      <div className="relative flex-1 min-h-0">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropCompleteHandler}
          showGrid
          style={{
            containerStyle: { background: "transparent" },
            cropAreaStyle: { border: "2px solid rgba(255,255,255,0.6)", color: "rgba(0,0,0,0.6)" },
          }}
        />
      </div>

      <div className="px-4 py-4 md:px-8 md:py-5 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <ZoomOut className="h-4 w-4 text-white/50 shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
              data-testid="slider-zoom"
            />
            <ZoomIn className="h-4 w-4 text-white/50 shrink-0" />
            <span className="text-xs text-white/40 w-10 text-right tabular-nums">{Math.round(zoom * 100)}%</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-white/60 text-xs lowercase gap-2"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            data-testid="button-rotate"
          >
            <RotateCw className="h-3.5 w-3.5" />
            girar 90°
          </Button>
        </div>
      </div>
    </div>
  );
}
