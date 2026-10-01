import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Printer,
  FileCheck,
  Building,
} from 'lucide-react';
import { Course, ReportDraft, ReportSection } from '../types';
import { generateOfficialSummarySentence, generateAchievementSentence } from '../utils/statistics';
import { generateWordDocument } from '../utils/docxExport';
import { copyHtmlTableToClipboard } from '../utils/clipboardHelper';
import { AiConfirmationModal } from './AiConfirmationModal';

interface ReportViewProps {
  courses: Course[];
  activeCourseId: string | null;
  aiAvailable: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({
  courses,
  activeCourseId,
  aiAvailable,
}) => {
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editContentText, setEditContentText] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>(activeCourse?.managerName || '교육기획담당자');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // AI Modal States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalAction, setAiModalAction] = useState<'opinions' | 'refine' | 'improvements' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [targetSectionForAi, setTargetSectionForAi] = useState<string | null>(null);

  // Generate initial report sections based on active course
  const generateInitialSections = (course: Course): ReportSection[] => {
    const evalData = course.evaluationData;

    // 1. Overview
    const sec1: ReportSection = {
      id: 'sec-overview',
      title: '과정 개요',
      type: 'overview',
      enabled: true,
      content: `가. 과정명: ${course.title} (${course.generation}기)
나. 교육기간: ${course.startDate} ~ ${course.endDate} (총 ${course.totalHours}시간)
다. 운영방식 및 대상: ${course.operationMode} / ${course.targetAudience || '공공기관 임직원'}
라. 교육목표: ${course.objectives || '직무 전문성 강화 및 공직 가치 내재화'}
마. 주관부서: ${course.managerDepartment || '인재개발원 교육기획부'} (담당자: ${course.managerName || '담당자'})`,
    };

    // 2. Operation
    const sec2: ReportSection = {
      id: 'sec-operation',
      title: '운영 결과 및 수료 현황',
      type: 'operation',
      enabled: true,
      content: `가. 교육생 수료 현황: 계획 ${course.targetCount}명 중 ${course.completionCount}명 수료 (수료율 ${course.completionRate}%)
나. 교육 운영 소견:
- 입교생 전원이 교육 일정에 성실히 참여하여 목표 수료율(${course.completionRate}%)을 달성하였음.
- 출석 관리 및 학습지원 체계를 체계적으로 가동하여 낙오자 없이 교육을 성공적으로 종료함.`,
    };

    // 3. Evaluation
    let evalContent = '설문 데이터가 아직 집계되지 않았습니다.';
    if (evalData) {
      const summaryText = generateOfficialSummarySentence(
        evalData.overallMean,
        evalData.scaleBase,
        evalData.diffPreviousOverall,
        evalData.areas
      );
      evalContent = `가. 설문 응답 개요: 수료생 ${course.completionCount}명 중 ${evalData.surveyRespondentCount}명 응답 (응답률 ${evalData.responseRate}%)
나. 종합 만족도 평가:
- ${summaryText}
다. 세부 영역별 평가:
${evalData.areas
  .map(
    (a) =>
      `· ${a.areaName} 영역: ${a.mean.toFixed(2)}점 (문항수: ${a.itemCount}개${
        a.diffPrevious !== undefined ? `, 전기대비: ${a.diffPrevious > 0 ? '+' : ''}${a.diffPrevious.toFixed(2)}점` : ''
      })`
  )
  .join('\n')}`;
    }

    const sec3: ReportSection = {
      id: 'sec-evaluation',
      title: '교육 만족도 평가 결과',
      type: 'evaluation',
      enabled: true,
      content: evalContent,
    };

    // 4. Achievement & Performance
    let achContent = '학업성취도(사전-사후) 평가 데이터가 등록되지 않았습니다.';
    if (evalData?.prePostAnalysis) {
      const achSentence = generateAchievementSentence(evalData.prePostAnalysis);
      achContent = `가. 커크패트릭(Kirkpatrick) 2단계(학습 성취도) 평가 결과:
- ${achSentence}
나. 성취도 분석 세부 지표:
· 평가 대상 인원: ${evalData.prePostAnalysis.sampleCount}명
· 진단 사전 평균: ${evalData.prePostAnalysis.preMean}점 (표준편차: ${evalData.prePostAnalysis.preStdDev})
· 수료 사후 평균: ${evalData.prePostAnalysis.postMean}점 (표준편차: ${evalData.prePostAnalysis.postStdDev})
· 역량 증진도: +${evalData.prePostAnalysis.improvementMean}점 향상 (증가율: +${evalData.prePostAnalysis.improvementRate}%)`;
    }

    const sec4: ReportSection = {
      id: 'sec-achievement',
      title: '성과 분석 (학업 성취도 및 역량 향상)',
      type: 'achievement',
      enabled: true,
      content: achContent,
    };

    // 5. Opinions
    let opinionsContent = '주관식 의견이 없습니다.';
    if (evalData && evalData.subjectiveOpinions.length > 0) {
      opinionsContent = `가. 주관식 설문 분석 요약:
${evalData.subjectiveSummary || '- 교육생 전반적으로 실무 사례 중심의 강의와 교재 완성도에 높은 호응을 표함.'}

나. 대표 교육생 의견 발췌:
${evalData.subjectiveOpinions.slice(0, 5).map((op, i) => `· "${op}"`).join('\n')}`;
    }

    const sec5: ReportSection = {
      id: 'sec-opinions',
      title: '교육생 의견 및 정성 평가',
      type: 'opinions',
      enabled: true,
      content: opinionsContent,
    };

    // 6. Improvements
    const sec6: ReportSection = {
      id: 'sec-improvements',
      title: '개선 사항 및 차기 환류 계획',
      type: 'improvements',
      enabled: true,
      content: `가. 교육 커리큘럼 및 실습 시간 조정:
- 분임토의 및 실무 기획서 작성 실습 시간 비중을 기존 30%에서 40%로 확대 편성 검토.
나. 강사진 피드백 및 강의 환경 고도화:
- 만족도가 높았던 강사진에 대한 차기 기수 우선 섭외 추진 및 실습실 네트워크 회선 보강 조치.
다. 사전 학습 수요조사 기반 맞춤형 교재 배포:
- 기수 시작 1주일 전 사전 설문을 통해 현업 고민 사례를 취합, 실습 예제에 적극 반영.`,
    };

    return [sec1, sec2, sec3, sec4, sec5, sec6];
  };

  useEffect(() => {
    if (activeCourse) {
      setReportSections(generateInitialSections(activeCourse));
      setAuthorName(activeCourse.managerName || '교육기획담당자');
    }
  }, [activeCourseId, activeCourse]);

  // Handle edit section
  const startEditing = (sec: ReportSection) => {
    setEditingSectionId(sec.id);
    setEditContentText(sec.content);
  };

  const saveEditing = (id: string) => {
    setReportSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content: editContentText } : s))
    );
    setEditingSectionId(null);
  };

  // Section order adjustment
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === reportSections.length - 1) return;

    const newSections = [...reportSections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;
    setReportSections(newSections);
  };

  // Delete section
  const deleteSection = (id: string) => {
    if (window.confirm('해당 목차 섹션을 보고서에서 삭제하시겠습니까?')) {
      setReportSections((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Add custom section
  const addCustomSection = () => {
    const title = prompt('추가할 목차 제목을 입력하세요 (예: 7. 예산 집행 현황)');
    if (!title) return;
    const newSec: ReportSection = {
      id: 'sec-custom-' + Date.now(),
      title,
      type: 'custom',
      enabled: true,
      content: '- 세부 내용을 입력하세요.',
    };
    setReportSections((prev) => [...prev, newSec]);
  };

  // Export to Word (.docx)
  const handleExportWord = async () => {
    if (!activeCourse) return;
    const draft: ReportDraft = {
      courseId: activeCourse.id,
      title: activeCourse.title,
      generatedDate: reportDate,
      author: authorName,
      sections: reportSections,
    };
    try {
      await generateWordDocument(activeCourse, draft);
    } catch (e: any) {
      alert('Word 생성 실패: ' + e.message);
    }
  };

  // Copy Section as HTML Table for Hancom Office (HWP) & MS Word
  const handleCopySectionAsHtml = async (section: ReportSection) => {
    let tableHtml = '';
    const plainText = `[${section.title}]\n\n${section.content}`;

    if (section.type === 'overview') {
      tableHtml = `
        <table border="1" style="border-collapse:collapse; width:100%;">
          <tr><th style="background:#f1f5f9; width:25%;">과정명 (기수)</th><td>${activeCourse.title} (${activeCourse.generation}기)</td></tr>
          <tr><th style="background:#f1f5f9;">교육기간</th><td>${activeCourse.startDate} ~ ${activeCourse.endDate} (${activeCourse.totalHours}시간)</td></tr>
          <tr><th style="background:#f1f5f9;">운영방식 / 대상</th><td>${activeCourse.operationMode} / ${activeCourse.targetAudience}</td></tr>
          <tr><th style="background:#f1f5f9;">교육목표</th><td>${activeCourse.objectives || '-'}</td></tr>
          <tr><th style="background:#f1f5f9;">담당부서 / 담당자</th><td>${activeCourse.managerDepartment} ${activeCourse.managerName}</td></tr>
        </table>
        <p>${section.content.replace(/\n/g, '<br/>')}</p>
      `;
    } else if (section.type === 'operation') {
      tableHtml = `
        <table border="1" style="border-collapse:collapse; width:100%; text-align:center;">
          <tr style="background:#f1f5f9;"><th>계획 교육인원</th><th>최종 수료인원</th><th>수료율(%)</th></tr>
          <tr><td>${activeCourse.targetCount}명</td><td>${activeCourse.completionCount}명</td><td><strong>${activeCourse.completionRate}%</strong></td></tr>
        </table>
        <p>${section.content.replace(/\n/g, '<br/>')}</p>
      `;
    } else if (section.type === 'evaluation' && activeCourse.evaluationData) {
      const items = activeCourse.evaluationData.items;
      tableHtml = `
        <table border="1" style="border-collapse:collapse; width:100%;">
          <tr style="background:#f1f5f9; text-align:center;">
            <th>평가영역</th><th>문항내용</th><th>평균점수</th><th>표준편차</th><th>전기대비</th>
          </tr>
          ${items
            .map(
              (it) => `<tr>
              <td style="text-align:center;">${it.areaName}</td>
              <td>${it.columnHeader}</td>
              <td style="text-align:right;"><strong>${it.mean.toFixed(2)}점</strong></td>
              <td style="text-align:right;">${it.standardDeviation.toFixed(2)}</td>
              <td style="text-align:center;">${it.diffPrevious !== undefined ? (it.diffPrevious > 0 ? '+' : '') + it.diffPrevious.toFixed(2) : '-'}</td>
            </tr>`
            )
            .join('')}
          <tr style="background:#f8fafc; font-weight:bold;">
            <td style="text-align:center;">전체종합</td>
            <td>총 ${items.length}개 평가문항 평균</td>
            <td style="text-align:right;">${activeCourse.evaluationData.overallMean.toFixed(2)}점</td>
            <td style="text-align:right;">-</td>
            <td style="text-align:center;">${activeCourse.evaluationData.diffPreviousOverall !== undefined ? (activeCourse.evaluationData.diffPreviousOverall > 0 ? '+' : '') + activeCourse.evaluationData.diffPreviousOverall.toFixed(2) : '-'}</td>
          </tr>
        </table>
        <p>${section.content.replace(/\n/g, '<br/>')}</p>
      `;
    } else {
      tableHtml = `<div><h4>${section.title}</h4><p>${section.content.replace(/\n/g, '<br/>')}</p></div>`;
    }

    const success = await copyHtmlTableToClipboard(tableHtml, plainText);
    if (success) {
      setCopiedSectionId(section.id);
      setTimeout(() => setCopiedSectionId(null), 2500);
    } else {
      alert('클립보드 복사 권한이 거부되었습니다.');
    }
  };

  // Open AI Confirmation Modal
  const openAiTrigger = (action: 'opinions' | 'refine' | 'improvements', sectionId?: string) => {
    setAiModalAction(action);
    setTargetSectionForAi(sectionId || null);
    setAiModalOpen(true);
  };

  // Execute AI action after explicit user confirmation
  const handleConfirmAiExecution = async () => {
    if (!aiModalAction) return;
    setAiLoading(true);

    try {
      if (aiModalAction === 'opinions') {
        const ops = activeCourse.evaluationData?.subjectiveOpinions || [];
        const res = await fetch('/api/gemini/summarize-opinions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opinions: ops,
            courseTitle: `${activeCourse.title} (${activeCourse.generation}기)`,
          }),
        });
        const data = await res.json();
        if (data.result) {
          setReportSections((prev) =>
            prev.map((s) => (s.id === 'sec-opinions' ? { ...s, content: data.result } : s))
          );
        } else {
          throw new Error(data.error || 'AI 응답 실패');
        }
      } else if (aiModalAction === 'refine') {
        if (!targetSectionForAi) return;
        const targetSec = reportSections.find((s) => s.id === targetSectionForAi);
        if (!targetSec) return;

        const res = await fetch('/api/gemini/refine-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: targetSec.content,
            context: `${activeCourse.title} [${targetSec.title}] 섹션`,
          }),
        });
        const data = await res.json();
        if (data.result) {
          setReportSections((prev) =>
            prev.map((s) => (s.id === targetSectionForAi ? { ...s, content: data.result } : s))
          );
        } else {
          throw new Error(data.error || 'AI 윤문 실패');
        }
      } else if (aiModalAction === 'improvements') {
        const statsSummary = `과정명: ${activeCourse.title} (${activeCourse.generation}기)
수료율: ${activeCourse.completionRate}%
전체만족도: ${activeCourse.evaluationData?.overallMean || '미집계'}점
영역별만족도: ${activeCourse.evaluationData?.areas.map((a) => `${a.areaName}: ${a.mean}점`).join(', ')}
성취도향상률: ${activeCourse.evaluationData?.prePostAnalysis?.improvementRate || '미실시'}%`;

        const res = await fetch('/api/gemini/suggest-improvements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statsSummary }),
        });
        const data = await res.json();
        if (data.result) {
          setReportSections((prev) =>
            prev.map((s) => (s.id === 'sec-improvements' ? { ...s, content: data.result } : s))
          );
        } else {
          throw new Error(data.error || 'AI 개선제안 실패');
        }
      }
      setAiModalOpen(false);
    } catch (err: any) {
      alert('AI 작업 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1-Line Usage Guide */}
      <div className="bg-purple-50/80 border border-purple-200/90 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-purple-950 shadow-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-purple-800">사용 방법:</span>
          <span>
            보고서 목차와 자동 생성된 공문서 문장을 확인·수정하고, <strong>Word(.docx) 다운로드</strong>나 <strong>한글(HWP) 표 복사</strong>를 클릭해 즉시 결재 문서로 활용하세요.
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportWord}
            className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Word(.docx) 다운로드
          </button>
        </div>
      </div>

      {/* Report Header Metadata Panel */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-purple-700 font-semibold tracking-wide uppercase">
            공공기관 표준 연수 결과보고서 초안
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            [결과보고] {activeCourse?.title} ({activeCourse?.generation}기)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">보고서 일자:</span>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">작성자:</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="작성자 성명/직급"
              className="border border-slate-300 rounded px-2 py-1 text-xs w-32"
            />
          </div>
          <button
            onClick={addCustomSection}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded inline-flex items-center gap-1 transition"
          >
            <Plus className="w-3 h-3" />
            목차 항목 추가
          </button>
        </div>
      </div>

      {/* AI Assistance Global Bar (Shown only when aiAvailable is true) */}
      {aiAvailable && (
        <div className="bg-emerald-950/90 text-white rounded-lg p-4 border border-emerald-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-800/80 flex items-center justify-center text-emerald-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                Gemini AI 지원 도구 (선택 사항)
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                주관식 의견 요약, 공문서 문체 윤문, 통계 기반 개선방안 초안을 버튼 클릭 시 생성합니다. (전송 전 확인창 표시)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openAiTrigger('opinions')}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-medium rounded border border-emerald-700 transition inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-300" />
              주관식 의견 AI 요약
            </button>
            <button
              onClick={() => openAiTrigger('improvements')}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-medium rounded border border-emerald-700 transition inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-300" />
              개선사항 초안 AI 제안
            </button>
          </div>
        </div>
      )}

      {/* Main Sections Accordion / Cards */}
      <div className="space-y-5">
        {reportSections.map((sec, index) => {
          const isEditing = editingSectionId === sec.id;
          const isCopied = copiedSectionId === sec.id;

          return (
            <div
              key={sec.id}
              className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden transition-all"
            >
              {/* Section Header */}
              <div className="px-5 py-3.5 bg-purple-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-purple-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                </div>

                {/* Section Action Buttons */}
                <div className="flex items-center gap-1.5 text-xs">
                  {/* AI Refine button for this section */}
                  {aiAvailable && !isEditing && (
                    <button
                      onClick={() => openAiTrigger('refine', sec.id)}
                      title="이 문단을 공문서 표준 문체(~함, 개조식)로 윤문"
                      className="px-2 py-1 text-purple-700 hover:bg-purple-100 rounded border border-purple-300 text-[11px] font-medium inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      공문서체 윤문
                    </button>
                  )}

                  {/* Copy HTML Table Button (for Hangul HWP and Word) */}
                  <button
                    onClick={() => handleCopySectionAsHtml(sec)}
                    title="한글(HWP) 및 워드에 붙여넣을 때 표 서식이 유지되도록 HTML로 복사"
                    className={`px-2.5 py-1 rounded border text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer ${
                      isCopied
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-white hover:bg-purple-50 text-purple-900 border-purple-200'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        한글 표 복사 완료!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-purple-600" />
                        한글(HWP) 표 복사
                      </>
                    )}
                  </button>

                  {/* Edit Toggle */}
                  {!isEditing ? (
                    <button
                      onClick={() => startEditing(sec)}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition"
                      title="문구 직접 수정"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => saveEditing(sec.id)}
                      className="px-2 py-0.5 bg-purple-600 text-white rounded text-[11px] font-bold"
                    >
                      저장
                    </button>
                  )}

                  {/* Order buttons */}
                  <button
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    title="위로 이동"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === reportSections.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    title="아래로 이동"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSection(sec.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="섹션 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Section Body */}
              <div className="p-5 space-y-4">
                {/* Embed specialized preview tables according to section type */}
                {sec.type === 'overview' && (
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <th className="py-2.5 px-3 bg-slate-100 font-semibold text-slate-700 w-28">
                            과정명 (기수)
                          </th>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {activeCourse.title} ({activeCourse.generation}기)
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="py-2.5 px-3 bg-slate-100 font-semibold text-slate-700">
                            교육기간
                          </th>
                          <td className="py-2.5 px-3 text-slate-800">
                            {activeCourse.startDate} ~ {activeCourse.endDate} (총 {activeCourse.totalHours}시간)
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="py-2.5 px-3 bg-slate-100 font-semibold text-slate-700">
                            운영방식 / 대상
                          </th>
                          <td className="py-2.5 px-3 text-slate-800">
                            {activeCourse.operationMode} / {activeCourse.targetAudience}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="py-2.5 px-3 bg-slate-100 font-semibold text-slate-700">
                            교육목표
                          </th>
                          <td className="py-2.5 px-3 text-slate-800">{activeCourse.objectives || '-'}</td>
                        </tr>
                        <tr>
                          <th className="py-2.5 px-3 bg-slate-100 font-semibold text-slate-700">
                            담당부서 / 담당자
                          </th>
                          <td className="py-2.5 px-3 text-slate-800">
                            {activeCourse.managerDepartment} {activeCourse.managerName}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {sec.type === 'operation' && (
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">계획 교육인원</th>
                          <th className="py-2.5 px-3">최종 수료인원</th>
                          <th className="py-2.5 px-3">수료율(%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2.5 px-3 text-slate-800">{activeCourse.targetCount}명</td>
                          <td className="py-2.5 px-3 text-slate-800">{activeCourse.completionCount}명</td>
                          <td className="py-2.5 px-3 font-bold text-blue-700 text-sm">
                            {activeCourse.completionRate}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {sec.type === 'evaluation' && activeCourse.evaluationData && (
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 w-24 text-center">평가영역</th>
                          <th className="py-2 px-3">설문 평가 문항</th>
                          <th className="py-2 px-3 text-right w-20">평균점수</th>
                          <th className="py-2 px-3 text-right w-20">표준편차</th>
                          <th className="py-2 px-3 text-center w-20">전기대비</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {activeCourse.evaluationData.items.map((it, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 text-center font-medium">{it.areaName}</td>
                            <td className="py-2 px-3">{it.columnHeader}</td>
                            <td className="py-2 px-3 text-right font-bold text-blue-700">
                              {it.mean.toFixed(2)}점
                            </td>
                            <td className="py-2 px-3 text-right text-slate-500 font-mono">
                              {it.standardDeviation.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {it.diffPrevious !== undefined ? (
                                <span
                                  className={
                                    it.diffPrevious > 0
                                      ? 'text-emerald-600 font-semibold'
                                      : it.diffPrevious < 0
                                      ? 'text-rose-600 font-semibold'
                                      : 'text-slate-400'
                                  }
                                >
                                  {it.diffPrevious > 0 ? `+${it.diffPrevious.toFixed(2)}` : it.diffPrevious.toFixed(2)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold border-t border-slate-300">
                          <td className="py-2 px-3 text-center text-blue-900">전체 종합</td>
                          <td className="py-2 px-3 text-blue-900">
                            총 {activeCourse.evaluationData.items.length}개 평가 문항 종합 평균
                          </td>
                          <td className="py-2 px-3 text-right text-blue-900 font-extrabold text-sm">
                            {activeCourse.evaluationData.overallMean.toFixed(2)}점
                          </td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-center text-blue-900">
                            {activeCourse.evaluationData.diffPreviousOverall !== undefined
                              ? (activeCourse.evaluationData.diffPreviousOverall > 0 ? '+' : '') +
                                activeCourse.evaluationData.diffPreviousOverall.toFixed(2)
                              : '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Content Editor or Rendered Prose */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={editContentText}
                      onChange={(e) => setEditContentText(e.target.value)}
                      className="w-full border border-blue-400 rounded-md p-3 text-xs leading-relaxed font-mono focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingSectionId(null)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => saveEditing(sec.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded"
                      >
                        저장 완료
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3.5 rounded border border-slate-100 font-sans">
                    {sec.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Output Action Toolbar */}
      <div className="bg-purple-950 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-xl z-30 border border-purple-800">
        <div>
          <div className="font-bold text-sm text-white">결과보고서 준비 완료</div>
          <p className="text-xs text-purple-300 mt-0.5">
            표준 공공기관 서식(맑은 고딕, A4 규격)으로 완성된 문서를 바로 내려받을 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-purple-900/80 hover:bg-purple-800 text-purple-100 text-xs font-medium rounded-md border border-purple-700 inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            인쇄 / PDF 저장
          </button>
          <button
            onClick={handleExportWord}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-md shadow-md inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Word(.docx) 파일 다운로드
          </button>
        </div>
      </div>

      {/* AI Execution Confirmation Modal */}
      <AiConfirmationModal
        isOpen={aiModalOpen}
        title={
          aiModalAction === 'opinions'
            ? '주관식 설문 의견 AI 종합 요약'
            : aiModalAction === 'refine'
            ? '보고서 문장 공문서 문체 윤문'
            : '통계 기반 개선사항 초안 제안'
        }
        description={
          aiModalAction === 'opinions'
            ? '수료생들의 주관식 의견을 주제별(교육내용, 강사, 운영, 환경)로 분류하고 긍정 평가 및 개선 요구를 개조식 공문서 스타일로 요약합니다.'
            : aiModalAction === 'refine'
            ? '선택된 목차의 문장을 행정안전부 공문서 작성 규칙 및 공공기관 표준 보고서 문체(~함, ~로 나타남)로 정제합니다.'
            : '만족도 및 성취도 통계 지표를 근거로 차기 기수 교육운영 개선을 위한 실무 조치 계획 4가지를 도출합니다.'
        }
        isLoading={aiLoading}
        onConfirm={handleConfirmAiExecution}
        onCancel={() => setAiModalOpen(false)}
      />
    </div>
  );
};
