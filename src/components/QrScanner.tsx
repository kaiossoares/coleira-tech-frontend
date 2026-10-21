import { useEffect, useRef, useState } from 'react';

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

export const qrSupported = () => typeof window !== 'undefined' && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia;

/**
 * Lê o QR code da etiqueta usando a câmera (BarcodeDetector nativo).
 * Navegadores sem suporte caem no campo de digitação manual.
 */
export function QrScanner({ onResult, onClose }: { onResult(text: string): void; onClose(): void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = videoRef.current;
        if (!video || stopped) return;
        video.srcObject = stream;
        await video.play();
        const detector = new window.BarcodeDetector!({ formats: ['qr_code'] });
        const loop = async () => {
          if (stopped) return;
          try {
            const [hit] = await detector.detect(video);
            if (hit?.rawValue) {
              onResult(hit.rawValue);
              return;
            }
          } catch {
            /* quadro ainda não pronto */
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        setError('Não foi possível acessar a câmera. Digite o código manualmente.');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Escanear QR code" style={{ position: 'fixed', inset: 0, background: 'rgba(18,32,58,0.92)', zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      {error ? (
        <p style={{ color: '#fff', textAlign: 'center', fontSize: 15 }}>{error}</p>
      ) : (
        <div style={{ position: 'relative', width: 'min(80vw, 320px)', aspectRatio: '1', borderRadius: 24, overflow: 'hidden', background: '#000' }}>
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 24, border: '3px solid #fff', borderRadius: 18 }} aria-hidden="true" />
        </div>
      )}
      <p style={{ color: '#DCE6FF', fontSize: 14, textAlign: 'center' }}>Aponte para o QR code na etiqueta interna da coleira.</p>
      <button type="button" className="btn btn--primary" style={{ maxWidth: 320 }} onClick={onClose}>
        Cancelar
      </button>
    </div>
  );
}
