import React, { useRef } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  TrendingUp,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Course } from '../types';

export type TabKey = 'dashboard' | 'course-form' | 'upload' | 'report' | 'comparison';

interface NavbarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  courses: Course[];
  activeCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
  onLoadSampleData: () => void;
  onExportTeamData: () => void;
  onImportTeamData: (file: File) => void;
  onResetAll: () => void;
  aiAvailable: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  courses,
  activeCourseId,
  onSelectCourse,
  onLoadSampleData,
  onExportTeamData,
  onImportTeamData,
  onResetAll,
  aiAvailable,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportTeamData(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-purple-950 text-white border-b border-purple-900/80 sticky top-0 z-40 shadow-sm">
      {/* Top Banner & Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 border-b border-purple-900/70 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">교육과정 평가·성과분석 보고서 도우미</span>
                <span className="text-[11px] font-medium text-purple-200 bg-purple-900/90 border border-purple-700/70 px-2 py-0.5 rounded">
                  공공연수원 실무용
                </span>
                {aiAvailable && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    AI 지원 활성
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-300/80">
                엑셀 1클릭 자동 집계 · Kirkpatrick 성과분석 · 한글(HWP)/Word 공문서 결과보고서 자동 생성
              </p>
            </div>
          </div>

          {/* Global Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Active Course Selector */}
            {courses.length > 0 && (
              <div className="flex items-center bg-purple-900/70 border border-purple-700/80 rounded-md px-2.5 py-1.5 text-purple-100">
                <span className="text-purple-300 mr-1.5">선택 과정:</span>
                <select
                  value={activeCourseId || ''}
                  onChange={(e) => onSelectCourse(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-purple-950 text-white">
                      {c.title} ({c.generation}기)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onLoadSampleData}
              title="검증용 가상 과정 3개와 만족도 응답 즉시 적재"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-900/70 hover:bg-purple-800 text-purple-100 rounded-md border border-purple-700/80 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-300" />
              샘플 데이터
            </button>

            <button
              onClick={onExportTeamData}
              title="전체 과정 및 집계 결과를 1개 엑셀 파일(5개 시트)로 다운로드"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-900/70 hover:bg-purple-800 text-purple-100 rounded-md border border-purple-700/80 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              팀 엑셀 내보내기
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="동료가 내보낸 엑셀 파일 불러와 통합"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-900/70 hover:bg-purple-800 text-purple-100 rounded-md border border-purple-700/80 transition"
            >
              <Upload className="w-3.5 h-3.5 text-amber-300" />
              팀 엑셀 불러오기
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />

            <button
              onClick={onResetAll}
              title="저장된 모든 데이터를 초기화합니다"
              className="inline-flex items-center gap-1 px-2 py-1.5 text-purple-300/80 hover:text-rose-400 hover:bg-purple-900/50 rounded-md transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기화
            </button>
          </div>
        </div>

        {/* 5 Tabs Navigation Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200 hover:text-white hover:bg-purple-900/70'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            1. 대시보드
            {courses.length > 0 && (
              <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded-full text-purple-200">
                {courses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('course-form')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentTab === 'course-form'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200 hover:text-white hover:bg-purple-900/70'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            2. 과정 등록
          </button>

          <button
            onClick={() => onSelectTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentTab === 'upload'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200 hover:text-white hover:bg-purple-900/70'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            3. 평가 데이터 업로드
            {activeCourse?.evaluationData && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('report')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentTab === 'report'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200 hover:text-white hover:bg-purple-900/70'
            }`}
          >
            <FileText className="w-4 h-4" />
            4. 결과보고서
          </button>

          <button
            onClick={() => onSelectTab('comparison')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentTab === 'comparison'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200 hover:text-white hover:bg-purple-900/70'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            5. 과정 비교
          </button>
        </nav>
      </div>
    </header>
  );
};
