import React from 'react';
import {
  Users,
  Award,
  GraduationCap,
  Sparkles,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Course } from '../types';
import { TabKey } from './Navbar';

interface DashboardViewProps {
  courses: Course[];
  activeCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
  onNavigateTab: (tab: TabKey) => void;
  onDeleteCourse: (courseId: string) => void;
  onLoadSample: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  courses,
  activeCourseId,
  onSelectCourse,
  onNavigateTab,
  onDeleteCourse,
  onLoadSample,
}) => {
  // Aggregate statistics
  const totalCourses = courses.length;
  const totalTrainees = courses.reduce((acc, c) => acc + (c.completionCount || 0), 0);

  const avgCompletionRate =
    totalCourses > 0
      ? Number((courses.reduce((acc, c) => acc + c.completionRate, 0) / totalCourses).toFixed(1))
      : 0;

  const evaluatedCourses = courses.filter((c) => c.evaluationData?.overallMean);
  const avgSatisfaction =
    evaluatedCourses.length > 0
      ? Number(
          (
            evaluatedCourses.reduce((acc, c) => acc + (c.evaluationData?.overallMean || 0), 0) /
            evaluatedCourses.length
          ).toFixed(2)
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Hero Section with 2x Larger Main Title in Purple Palette */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white p-7 sm:p-9 md:p-12 shadow-lg border border-purple-800/60">
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/80 border border-purple-600/70 text-purple-200 text-xs font-semibold mb-4 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse"></span>
            공공기관 연수원 교육기획 및 성과분석 전용 시스템
          </div>

          {/* Main Title 2x Larger */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            교육과정 평가·성과분석 보고서 도우미
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-purple-200/90 mt-4 leading-relaxed font-normal">
            설문·성취도 엑셀 1회 업로드로 문항별 자동 집계, Kirkpatrick 성과분석, 
            공문서 양식 결과보고서(Word·한글 HWP) 작성까지 한 번에 완료합니다.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-7">
            <button
              onClick={() => onNavigateTab('course-form')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-lg shadow-md transition inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              신규 과정 등록하기
            </button>
            <button
              onClick={onLoadSample}
              className="px-5 py-2.5 bg-purple-900/80 hover:bg-purple-800 text-purple-100 border border-purple-600/70 text-xs sm:text-sm font-semibold rounded-lg transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              샘플 데이터 3개 불러오기
            </button>
          </div>
        </div>

        {/* Ambient subtle glow background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 1-Line Usage Guide */}
      <div className="bg-purple-50/80 border border-purple-200/90 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-purple-950 shadow-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-purple-800">사용 방법:</span>
          <span>
            새로운 과정을 <strong>[과정 등록]</strong>하고, 설문 엑셀을 <strong>[평가 데이터 업로드]</strong>하면 만족도 집계와 <strong>[결과보고서]</strong>가 1초 만에 완성됩니다.
          </span>
        </div>
        <button
          onClick={() => onNavigateTab('course-form')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          신규 과정 등록
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Courses */}
        <div className="bg-white p-5 rounded-lg border border-purple-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-purple-900 tracking-wider">총 운영 과정</span>
            <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center text-purple-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">{totalCourses}개 과정</div>
            <span className="text-xs text-purple-700/80 font-medium">평가완료 {evaluatedCourses.length}건</span>
          </div>
        </div>

        {/* Total Trainees */}
        <div className="bg-white p-5 rounded-lg border border-purple-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-purple-900 tracking-wider">누적 수료 인원</span>
            <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center text-purple-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">{totalTrainees.toLocaleString()}명</div>
            <span className="text-xs text-slate-400">정원 대비</span>
          </div>
        </div>

        {/* Avg Completion Rate */}
        <div className="bg-white p-5 rounded-lg border border-purple-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-purple-900 tracking-wider">평균 수료율</span>
            <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">{avgCompletionRate}%</div>
            <span className="text-xs text-emerald-700 font-semibold">연수원 권장치 달성</span>
          </div>
        </div>

        {/* Avg Satisfaction */}
        <div className="bg-white p-5 rounded-lg border border-purple-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-purple-900 tracking-wider">전체 평균 만족도</span>
            <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-purple-900">
              {avgSatisfaction > 0 ? `${avgSatisfaction.toFixed(2)}점` : '-'}
            </div>
            <span className="text-xs text-slate-400">5.0점 만점 기준</span>
          </div>
        </div>
      </div>

      {/* Courses List Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/30">
          <div>
            <h2 className="text-base font-bold text-slate-900">연수 교육과정 목록 및 평가 현황</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              과정을 클릭하면 해당 과정의 설문 데이터와 결과보고서로 즉시 전환됩니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {courses.length === 0 && (
              <button
                onClick={onLoadSample}
                className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition"
              >
                테스트용 샘플 데이터 불러오기
              </button>
            )}
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 text-purple-600">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">등록된 교육과정이 없습니다</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              [과정 등록] 메뉴에서 직접 과정을 등록하거나, 상단의 [샘플 데이터 불러오기] 버튼을 눌러 테스트용 가상 데이터를 확인해 보세요.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={onLoadSample}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded shadow-xs transition"
              >
                샘플 데이터로 바로 둘러보기
              </button>
              <button
                onClick={() => onNavigateTab('course-form')}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded transition"
              >
                직접 신규 과정 등록
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">과정명 및 기수</th>
                  <th className="py-3 px-3">운영방식</th>
                  <th className="py-3 px-3">교육기간</th>
                  <th className="py-3 px-3 text-center">교육/수료인원</th>
                  <th className="py-3 px-3 text-center">수료율</th>
                  <th className="py-3 px-3 text-center">전체 만족도</th>
                  <th className="py-3 px-3">담당자</th>
                  <th className="py-3 px-4 text-right">관리 / 바로가기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {courses.map((course) => {
                  const isSelected = course.id === activeCourseId;
                  const hasEval = !!course.evaluationData;
                  const overall = course.evaluationData?.overallMean;
                  const diff = course.evaluationData?.diffPreviousOverall;

                  return (
                    <tr
                      key={course.id}
                      onClick={() => onSelectCourse(course.id)}
                      className={`hover:bg-purple-50/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-purple-50/70 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {course.title}{' '}
                              <span className="text-xs text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded ml-1">
                                {course.generation}기
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {course.targetAudience}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-slate-600">{course.operationMode} ({course.totalHours}H)</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {course.startDate} ~ {course.endDate}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="text-slate-900 font-semibold">{course.completionCount}</span>
                        <span className="text-slate-400"> / {course.targetCount}명</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-semibold text-slate-900">{course.completionRate}%</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {hasEval && overall !== undefined ? (
                          <div className="inline-flex items-center gap-1 font-bold text-slate-900">
                            <span className="text-purple-900 font-extrabold">{overall.toFixed(2)}점</span>
                            {diff !== undefined && (
                              <span
                                className={`text-[10px] font-semibold ${
                                  diff > 0
                                    ? 'text-emerald-600'
                                    : diff < 0
                                    ? 'text-rose-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {diff > 0 ? `▲+${diff.toFixed(2)}` : diff < 0 ? `▼${diff.toFixed(2)}` : '0.00'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">미집계 (엑셀필요)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {course.managerName}
                        <span className="text-slate-400 text-[10px] block">{course.managerDepartment}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              onSelectCourse(course.id);
                              onNavigateTab('upload');
                            }}
                            title="설문 엑셀 업로드 및 매핑"
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-purple-100 hover:text-purple-900 rounded border border-slate-300 font-medium inline-flex items-center gap-1 transition"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-purple-700" />
                            {hasEval ? '평가분석' : '데이터업로드'}
                          </button>
                          <button
                            onClick={() => {
                              onSelectCourse(course.id);
                              onNavigateTab('report');
                            }}
                            title="결과보고서 생성 및 Word/HWP 내보내기"
                            className="px-2.5 py-1 text-white bg-purple-700 hover:bg-purple-800 rounded font-medium inline-flex items-center gap-1 shadow-xs transition"
                          >
                            <FileText className="w-3 h-3" />
                            보고서
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Course Quick Card if available */}
      {courses.length > 0 && activeCourseId && (
        <div className="bg-purple-950 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-800/80 shadow-md">
          <div>
            <div className="text-xs text-purple-300 font-semibold tracking-wide uppercase">현재 선택된 작업 대상 과정</div>
            <h3 className="text-lg font-bold mt-1 text-white">
              {courses.find((c) => c.id === activeCourseId)?.title} (
              {courses.find((c) => c.id === activeCourseId)?.generation}기)
            </h3>
            <p className="text-xs text-purple-200/80 mt-1">
              목표: {courses.find((c) => c.id === activeCourseId)?.objectives || '설정되지 않음'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('upload')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              만족도 설문 데이터 관리
            </button>
            <button
              onClick={() => onNavigateTab('report')}
              className="px-4 py-2 bg-white hover:bg-purple-50 text-purple-950 text-xs font-bold rounded-lg shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-700" />
              공문서 결과보고서 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
