import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, Loader2, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Browser-camera QR scanner. Renders a video preview and calls onScan(qrText) when detected.
 */
export function QrScanner({ onScan, onClose, title, inputLabel, testId = "qr-scanner" }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const qrRef = useRef(null);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState("");

  const stopCamera = async () => {
    const qr = qrRef.current;
    if (qr && qr.isScanning) {
      try { await qr.stop(); qr.clear(); } catch { /* noop */ }
    }
  };

  useEffect(() => {
    if (manualMode) {
      stopCamera();
      return;
    }

    let cancelled = false;
    const start = async () => {
      try {
        const el = containerRef.current;
        if (!el) return;
        const qr = new Html5Qrcode(el.id);
        qrRef.current = qr;
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (cancelled) return;
            onScan?.(decodedText);
            try { qr.stop().then(() => qr.clear()); } catch { /* noop */ }
          },
          () => { /* per-frame decode errors — ignore */ }
        );
        if (!cancelled) setStarting(false);
      } catch (e) {
        setError("Could not start camera. Please grant camera permission.");
        setStarting(false);
      }
    };
    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [onScan, manualMode]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    onScan?.(manualId.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" data-testid={testId}>
      <div className="w-full max-w-md bg-white rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{title ? t(title) : t("Scan Ticket QR")}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="qr-scanner-close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {manualMode ? (
          <div className="p-6 bg-slate-50 min-h-[320px] flex flex-col justify-center">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {inputLabel ? t(inputLabel) : t("Enter Ticket / RSVP ID")}
                </label>
                <Input 
                  value={manualId} 
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. EVENT_RSVP:123:abc" 
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full font-bold">
                {t("Submit ID")}
              </Button>
            </form>
          </div>
        ) : (
          <div className="relative bg-black" style={{ minHeight: 320 }}>
            <div id="qr-scanner-reader" ref={containerRef} className="w-full" />
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> {t("Starting camera…")}
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center text-red-300 text-sm p-6 text-center">
                {error}
              </div>
            )}
          </div>
        )}
        <div className="p-3 bg-white text-[11px] text-muted-foreground text-center border-t flex items-center justify-between">
          <span>{manualMode ? t("Type the ID provided by the member.") : t("Position the QR inside the frame.")}</span>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setManualMode(!manualMode)}>
            {manualMode ? <><Camera className="h-3 w-3 mr-1" /> {t("Use Camera")}</> : <><Keyboard className="h-3 w-3 mr-1" /> {t("Enter Manually")}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
