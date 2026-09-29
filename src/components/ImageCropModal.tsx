import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Undo2 } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCrop: (croppedDataUrl: string) => void;
  cropShape?: 'round' | 'rect';
  aspectRatio?: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  outputSize = 400
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas center to image center and rotate
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = outputSize;
  croppedCanvas.height = outputSize;
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Cropped canvas 2D context not available');
  }

  // Draw the cropped image onto the target canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return croppedCanvas.toDataURL('image/jpeg', 0.88);
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onConfirmCrop,
  cropShape = 'round',
  aspectRatio = 1,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (newCrop: Point) => {
    setCrop(newCrop);
  };

  const onCropAreaComplete = useCallback(
    (_croppedArea: Area, currentCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(currentCroppedAreaPixels);
    },
    []
  );

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        400
      );
      onConfirmCrop(croppedImage);
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
      alert('Error al procesar el recorte de la imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#1C1C1E] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 z-10 bg-[#1C1C1E]">
          <div>
            <h3 className="text-base font-bold text-white">Encuadrar Foto de Perfil</h3>
            <p className="text-xs text-[#8E8E93]">Arrastra para centrar y ajusta el zoom</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center ios-touch"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-72 sm:h-80 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        {/* Controls Container */}
        <div className="p-4 sm:p-5 space-y-4 bg-[#1C1C1E] border-t border-white/10">
          {/* Zoom Slider */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setZoom(Math.max(1, zoom - 0.2))}
              className="p-1.5 rounded-lg bg-[#2C2C2E] text-[#8E8E93] hover:text-white ios-touch"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#30D158] h-1.5 bg-[#2C2C2E] rounded-lg cursor-pointer"
              />
              <span className="text-xs text-[#8E8E93] font-mono w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => setZoom(Math.min(3, zoom + 0.2))}
              className="p-1.5 rounded-lg bg-[#2C2C2E] text-[#8E8E93] hover:text-white ios-touch"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Adjustment Tools */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="px-3 py-1.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white flex items-center space-x-1.5 ios-touch"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#30D158]" />
                <span>Girar 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-[#8E8E93] hover:text-white flex items-center space-x-1.5 ios-touch"
                title="Restablecer encuadre"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>

            <span className="text-[11px] text-[#8E8E93]">
              {cropShape === 'round' ? '⭕ Recorte circular' : '⏹️ Recorte cuadrado'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white font-semibold text-xs ios-touch"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApply}
              className="flex-1 py-3 rounded-xl bg-[#30D158] hover:bg-[#28B84B] disabled:opacity-50 text-black font-bold text-xs ios-touch flex items-center justify-center space-x-1.5 shadow-lg"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isProcessing ? 'Procesando...' : 'Aplicar Foto'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
