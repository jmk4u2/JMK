import React from 'react';
import { AlertCircle, Sparkles, X, ShieldCheck } from 'lucide-react';

interface AiConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const AiConfirmationModal: React.FC<AiConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-300 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          <p className="text-slate-800 leading-relaxed font-medium text-sm">
            {description}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>외부 AI 서비스 전송 안내</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800/90">
              해당 버튼을 클릭하면 <strong>입력 내용이 AI 서비스로 전송</strong>됩니다.
              성명·사번 등 개인식별정보는 사전에 제외되었으며, 오직 분석 및 문장 윤문을 위한 텍스트만 전달됩니다.
              계속 진행하시겠습니까?
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>원하지 않으실 경우 취소 후 직접 작성·편집하실 수 있습니다.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded border border-slate-300 transition"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded shadow-xs inline-flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                AI 분석 및 작성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                동의하고 AI 실행
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
