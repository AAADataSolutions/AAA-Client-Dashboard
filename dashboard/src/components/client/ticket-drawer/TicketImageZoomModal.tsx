import React from 'react';
import { Download, X } from 'lucide-react';

interface TicketImageZoomModalProps {
  zoomedImageUrl: string | null;
  zoomedImageName: string;
  onClose: () => void;
}

export function TicketImageZoomModal({
  zoomedImageUrl,
  zoomedImageName,
  onClose,
}: TicketImageZoomModalProps) {
  if (!zoomedImageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col cursor-default"
      >
        <div className="p-3.5 bg-black/50 flex items-center justify-between text-white border-b border-white/10">
          <span className="text-xs font-semibold truncate max-w-sm">{zoomedImageName}</span>
          <div className="flex items-center gap-2">
            <a
              href={zoomedImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center gap-1 text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-2 flex-1 flex items-center justify-center overflow-auto bg-black/30">
          <img src={zoomedImageUrl} alt={zoomedImageName} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
        </div>
      </div>
    </div>
  );
}
