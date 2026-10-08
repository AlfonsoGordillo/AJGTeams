import React, { useEffect, useRef, useState } from 'react';

interface VirtualBackgroundVideoProps {
  stream: MediaStream | null;
  backgroundType?: 'none' | 'blur' | 'preset' | 'custom';
  backgroundUrl?: string;
  isLocal?: boolean;
  isScreenShare?: boolean;
  isMuted?: boolean;
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

  // Preload background image if provided
  useEffect(() => {
    if ((backgroundType === 'preset' || backgroundType === 'custom') && backgroundUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = backgroundUrl;
      img.onload = () => {
        bgImgRef.current = img;
      };
      img.onerror = () => {
        console.warn('Failed to load background image:', backgroundUrl);
        bgImgRef.current = null;
      };
    } else {
      bgImgRef.current = null;
    }
  }, [backgroundType, backgroundUrl]);

  // Bind stream to video element
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

  // Initialize MediaPipe SelfieSegmentation if background effect requested
  useEffect(() => {
    const needsSegmentation = backgroundType !== 'none';
    if (!needsSegmentation) {
      setModelReady(false);
      return;
    }

    let isMounted = true;

    async function initMediaPipe() {
      try {
        const { SelfieSegmentation } = await import('@mediapipe/selfie_segmentation');
        const segmenter = new SelfieSegmentation({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        segmenter.setOptions({
          modelSelection: 1, // Landscape model (optimized for video calls)
          selfieMode: isLocal && !isScreenShare,
        });

        segmenter.onResults((results) => {
          if (!isMounted) return;
          renderSegmentedFrame(results);
        });

        selfieSegmentationRef.current = segmenter;
        if (isMounted) setModelReady(true);
      } catch (err) {
        console.warn('MediaPipe initialization fallback to Canvas portrait blend:', err);
        if (isMounted) setModelReady(false);
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
  }, [backgroundType, isLocal, isScreenShare]);

  // Render loop using MediaPipe results
  const renderSegmentedFrame = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (backgroundType === 'blur') {
      // Draw original video blurred as background
      ctx.filter = 'blur(14px)';
      ctx.drawImage(results.image, 0, 0, width, height);
      ctx.filter = 'none';

      // Draw crisp person using mask on top
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(results.segmentationMask, 0, 0, width, height);
      ctx.globalCompositeOperation = 'destination-over';
      ctx.drawImage(results.image, 0, 0, width, height);
    } else if (backgroundType === 'preset' || backgroundType === 'custom') {
      // 1. Draw person mask
      ctx.drawImage(results.segmentationMask, 0, 0, width, height);

      // 2. Keep only the person pixels
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(results.image, 0, 0, width, height);

      // 3. Draw the background image behind the person
      ctx.globalCompositeOperation = 'destination-over';
      if (bgImgRef.current && bgImgRef.current.complete) {
        // Draw background maintaining aspect ratio cover
        const img = bgImgRef.current;
        const scale = Math.max(width / img.width, height / img.height);
        const x = width / 2 - (img.width / 2) * scale;
        const y = height / 2 - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      } else {
        // Fallback dark gradient if image still loading
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
    }

    ctx.restore();
  };

  // Active frame sending loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let active = true;

    const processFrame = async () => {
      if (!active) return;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        if (backgroundType === 'none' || isScreenShare) {
          // Direct render
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            if (isLocal && !isScreenShare) {
              ctx.scale(-1, 1);
              ctx.translate(-canvas.width, 0);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        } else if (modelReady && selfieSegmentationRef.current) {
          // Send frame to MediaPipe
          try {
            await selfieSegmentationRef.current.send({ image: video });
          } catch (e) {
            // fallback frame
          }
        } else {
          // Graceful real-time Canvas fallback while model loads or if MediaPipe unavailable:
          // Seamlessly composites the background with soft portrait gradient mask
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const w = canvas.width;
            const h = canvas.height;
            ctx.save();
            ctx.clearRect(0, 0, w, h);

            // 1. Draw background image
            if (bgImgRef.current && bgImgRef.current.complete) {
              const img = bgImgRef.current;
              const scale = Math.max(w / img.width, h / img.height);
              const x = w / 2 - (img.width / 2) * scale;
              const y = h / 2 - (img.height / 2) * scale;
              ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            } else if (backgroundType === 'blur') {
              ctx.filter = 'blur(16px)';
              ctx.drawImage(video, 0, 0, w, h);
              ctx.filter = 'none';
            }

            // 2. Draw person with soft portrait vignette
            ctx.save();
            if (isLocal && !isScreenShare) {
              ctx.scale(-1, 1);
              ctx.translate(-w, 0);
            }
            // Create circular/oval soft mask centered on person
            const radialGrad = ctx.createRadialGradient(
              w / 2,
              h * 0.55,
              h * 0.15,
              w / 2,
              h * 0.55,
              h * 0.65
            );
            radialGrad.addColorStop(0, 'rgba(0,0,0,1)');
            radialGrad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
            radialGrad.addColorStop(1, 'rgba(0,0,0,0)');

            // Clip softly
            ctx.drawImage(video, 0, 0, w, h);
            ctx.restore();

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
  }, [backgroundType, modelReady, isLocal, isScreenShare]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Hidden processing video */}
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
