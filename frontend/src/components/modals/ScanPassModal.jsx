import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api, extractErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export function ScanPassModal({ isOpen, onClose, organizationId, onScanSuccess }) {
  const { t } = useLanguage();
  const open = isOpen;
  const orgId = organizationId;
  const [mode, setMode] = useState("camera"); // 'camera' or 'manual'
  const [manualCode, setManualCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrRef = useRef(null);

  const handleScan = async (code) => {
    if (!code || isSubmitting) return;
    setIsSubmitting(true);
    let toastId = toast.loading(t("Verifying Pass..."));
    try {
      const res = await api.post(`/bhojanshala/${orgId}/passes/${code}/scan`, {
        deviceInfo: { method: mode }
      });
      toast.success(t("Pass Scanned Successfully!"), { id: toastId });
      onScanSuccess(res.data?.data);
      if (qrRef.current && qrRef.current.isScanning) {
        try { await qrRef.current.stop(); qrRef.current.clear(); } catch {}
      }
      onClose();
    } catch (e) {
      toast.error(extractErrorMessage(e) || t("Invalid or already scanned pass"), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (open && mode === "camera") {
      let cancelled = false;
      const startScanner = async () => {
        try {
          const qr = new Html5Qrcode("bhojanshala-qr-reader");
          qrRef.current = qr;
          await qr.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              if (cancelled) return;
              handleScan(decodedText);
            },
            () => {} // ignore decode errors
          );
        } catch (e) {
          console.error("Camera start error", e);
          toast.error(t("Could not start camera. Using manual mode."));
          setMode("manual");
        }
      };
      
      // Add a slight delay to allow the dialog to animate and render the div
      const timer = setTimeout(startScanner, 300);
      return () => {
        cancelled = true;
        clearTimeout(timer);
        if (qrRef.current && qrRef.current.isScanning) {
          qrRef.current.stop().then(() => qrRef.current.clear()).catch(() => {});
        }
      };
    }
  }, [open, mode]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
  };

  const handleClose = () => {
    if (qrRef.current && qrRef.current.isScanning) {
      qrRef.current.stop().then(() => qrRef.current.clear()).catch(() => {});
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Bhojanshala Pass</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
          <button
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "camera" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setMode("camera")}
          >
            Camera Scanner
          </button>
          <button
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "manual" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setMode("manual")}
          >
            Manual Entry
          </button>
        </div>

        {mode === "camera" && (
          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black min-h-[300px]">
             <div id="bhojanshala-qr-reader" className="w-full" />
             <div className="p-3 text-[11px] text-slate-400 text-center absolute bottom-0 w-full bg-black/50">
               Position the QR inside the frame.
             </div>
          </div>
        )}

        {mode === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Pass ID / Booking ID</label>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter alphanumeric pass ID..."
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={!manualCode.trim() || isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify & Mark Entry"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
