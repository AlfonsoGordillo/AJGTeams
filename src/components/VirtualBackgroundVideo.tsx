import React, { useEffect, useRef, useState } from 'react';

interface VirtualBackgroundVideoProps {
  stream: MediaStream | null;
  backgroundType?: 'none' | 'blur' | 'preset' | 'custom';
  backgroundUrl?: string;
  isLocal?: boolean;
  isScreenShare?: boolean;
  isMuted?: boolean;
}

// Helper to resolve the SelfieSegmentation constructor in browser environments
async function getSelfieSegmentationClass(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).SelfieSegmentation) {
    return (window as any).SelfieSegmentation;
  }

  try {
    const mp = await import('@mediapipe/selfie_segmentation');
    const Cls =
      (mp as any).SelfieSegmentation ||
      ((mp as any).default && (mp as any).default.SelfieSegmentation) ||
      (typeof window !== 'undefined' && (window as any).SelfieSegmentation);
    if (Cls) return Cls;
  } catch (err) {
    console.warn('Direct dynamic import of @mediapipe/selfie_segmentation warning:', err);
  }

  // Fallback: dynamically load via script if not yet ready
  if (typeof window !== 'undefined' && !(window as any).SelfieSegmentation) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-mp-selfie]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
        return;
      }
      const script = document.createElement('script');
      script.setAttribute('data-mp-selfie', 'true');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  return typeof window !== 'undefined' ? (window as any).SelfieSegmentation : null;
}

export const VirtualBackgroundVideo: React.FC<VirtualBackgroundVideoProps> = ({
  stream,
  backgroundType = 'none',
  backgroundUrl,
  isLocal = false,
  isScreenShare = false,
  isMuted = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const selfieSegmentationRef = useRef<any>(null);
  const [modelReady, setModelReady] = useState(false);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const isSendingRef = useRef(false);

  // Store latest props in refs so callbacks never get stale
  const bgTypeRef = useRef(backgroundType);
  const bgUrlRef = useRef(backgroundUrl);
  const isLocalRef = useRef(isLocal);
  const isScreenShareRef = useRef(isScreenShare);

  useEffect(() => {
    bgTypeRef.current = backgroundType;
  }, [backgroundType]);

  useEffect(() => {
    bgUrlRef.current = backgroundUrl;
  }, [backgroundUrl]);

  useEffect(() => {
    isLocalRef.current = isLocal;
  }, [isLocal]);

  useEffect(() => {
    isScreenShareRef.current = isScreenShare;
  }, [isScreenShare]);

  // Preload background image if provided (handles both remote URLs and local data/blob URLs)
  useEffect(() => {
    if ((backgroundType === 'preset' || backgroundType === 'custom') && backgroundUrl) {
      const img = new Image();
      // CRITICAL: Do NOT set crossOrigin on data: or blob: URIs to avoid browser taint/onerror
      if (!backgroundUrl.startsWith('data:') && !backgroundUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = backgroundUrl;
      img.onload = () => {
        bgImgRef.current = img;
      };
      img.onerror = () => {
        console.warn('Failed to load virtual background image:', backgroundUrl.slice(0, 60));
        bgImgRef.current = null;
      };
    } else {
      bgImgRef.current = null;
    }
  }, [backgroundType, backgroundUrl]);

  // Bind media stream to internal hidden video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (stream) {
        video.srcObject = stream;
        video.play().catch((e) => console.warn('Video play interrupted:', e));
      } else {
        video.srcObject = null;
      }
    }
  }, [stream]);

  // Initialize MediaPipe SelfieSegmentation (one instance per component lifecycle)
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        const SelfieClass = await getSelfieSegmentationClass();
        if (!SelfieClass) {
          throw new Error('SelfieSegmentation constructor not found');
        }

        const segmenter = new SelfieClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        segmenter.setOptions({
          modelSelection: 1, // 1 = landscape model optimized for video calls
          selfieMode: isLocal && !isScreenShare,
        });

        segmenter.onResults((results: any) => {
          if (!isMounted) return;
          renderSegmentedFrame(results);
        });

        // Pre-initialize
        if (segmenter.initialize) {
          await segmenter.initialize();
        }

        selfieSegmentationRef.current = segmenter;
        if (isMounted) {
          setModelReady(true);
        }
      } catch (err) {
        console.warn('MediaPipe initialization warning (will use smooth portrait fallback):', err);
        if (isMounted) {
          setModelReady(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (selfieSegmentationRef.current) {
        try {
          selfieSegmentationRef.current.close();
        } catch (e) {
          // ignore
        }
        selfieSegmentationRef.current = null;
      }
    };
  }, [isLocal, isScreenShare]);

  // Render loop using MediaPipe AI segmentation mask
  const renderSegmentedFrame = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const currentBgType = bgTypeRef.current;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (currentBgType === 'blur') {
      // 1. Draw segmentation mask
      ctx.drawImage(results.segmentationMask, 0, 0, width, height);

      // 2. Keep only the sharp person pixels
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(results.image, 0, 0, width, height);

      // 3. Draw blurred camera video behind person
      ctx.globalCompositeOperation = 'destination-over';
      ctx.filter = 'blur(16px)';
      ctx.drawImage(results.image, 0, 0, width, height);
      ctx.filter = 'none';
    } else if (currentBgType === 'preset' || currentBgType === 'custom') {
      // 1. Draw segmentation mask
      ctx.drawImage(results.segmentationMask, 0, 0, width, height);

      // 2. Keep only the sharp person pixels
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(results.image, 0, 0, width, height);

      // 3. Draw the background image behind person
      ctx.globalCompositeOperation = 'destination-over';
      const img = bgImgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const x = width / 2 - (img.naturalWidth / 2) * scale;
        const y = height / 2 - (img.naturalHeight / 2) * scale;
        ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
      } else {
        // Fallback modern studio dark gradient
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // Fallback direct draw
      ctx.drawImage(results.image, 0, 0, width, height);
    }

    ctx.restore();
  };

  // Active rendering frame loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let active = true;

    const processFrame = async () => {
      if (!active) return;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        // Keep canvas dimensions synced with source video resolution
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const currentBgType = bgTypeRef.current;
        const screenShare = isScreenShareRef.current;
        const local = isLocalRef.current;

        if (currentBgType === 'none' || screenShare) {
          // Direct render without virtual background
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            if (local && !screenShare) {
              ctx.scale(-1, 1);
              ctx.translate(-canvas.width, 0);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        } else if (modelReady && selfieSegmentationRef.current) {
          // Dispatch frame to MediaPipe AI (with concurrency throttle)
          if (!isSendingRef.current) {
            isSendingRef.current = true;
            try {
              await selfieSegmentationRef.current.send({ image: video });
            } catch (e) {
              // Ignore transient send errors
            } finally {
              isSendingRef.current = false;
            }
          }
        } else {
          // Immediate Canvas fallback while AI model loads or if WebAssembly is unavailable:
          // Immediately displays the chosen or uploaded background with smooth portrait composite
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();
            ctx.clearRect(0, 0, w, h);

            if (currentBgType === 'blur') {
              ctx.save();
              ctx.filter = 'blur(16px)';
              if (local && !screenShare) {
                ctx.scale(-1, 1);
                ctx.translate(-w, 0);
              }
              ctx.drawImage(video, 0, 0, w, h);
              ctx.restore();
            } else {
              // 1. Draw the chosen/uploaded background image FIRST
              const img = bgImgRef.current;
              if (img && img.complete && img.naturalWidth > 0) {
                const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
                const x = w / 2 - (img.naturalWidth / 2) * scale;
                const y = h / 2 - (img.naturalHeight / 2) * scale;
                ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
              } else {
                const grad = ctx.createLinearGradient(0, 0, w, h);
                grad.addColorStop(0, '#1e293b');
                grad.addColorStop(0.5, '#0f172a');
                grad.addColorStop(1, '#020617');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
              }

              // 2. Draw user clipped softly in the center portrait area
              ctx.save();
              ctx.beginPath();
              ctx.ellipse(w / 2, h * 0.52, w * 0.36, h * 0.46, 0, 0, Math.PI * 2);
              ctx.clip();
              if (local && !screenShare) {
                ctx.scale(-1, 1);
                ctx.translate(-w, 0);
              }
              ctx.drawImage(video, 0, 0, w, h);
              ctx.restore();
            }

            ctx.restore();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [modelReady]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
      {/* Hidden processing video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted || isLocal}
        className="hidden"
      />

      {/* Rendered Canvas with segmentation and virtual background */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
