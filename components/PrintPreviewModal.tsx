'use client';

import { AnalysisReportContent } from '@/components/AnalysisReportContent';

export function PrintPreviewModal({
  analysis,
  score,
  stats,
  categoryStyle,
  formatDate,
  videoMeta,
  isOpen,
  onClose,
}: {
  analysis: any;
  score?: any;
  stats?: any;
  categoryStyle: any;
  formatDate: (value: string | null) => string;
  videoMeta: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print modal-container">
      <div className="bg-white w-[210mm] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl modal-container-content">
        <div className="sticky top-0 bg-slate-900 text-white p-4 flex justify-between items-center no-print">
          <h3 className="font-bold">Yazdirma Onizleme</h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1 text-sm bg-slate-700 rounded">
              Iptal
            </button>
            <button onClick={handlePrint} className="px-4 py-1 text-sm bg-blue-600 rounded font-bold">
              Yazdir / PDF Kaydet
            </button>
          </div>
        </div>
        <AnalysisReportContent
          analysis={analysis}
          score={score}
          stats={stats}
          categoryStyle={categoryStyle}
          formatDate={formatDate}
          videoMeta={videoMeta}
          printId="printable-report"
        />
      </div>
    </div>
  );
}
