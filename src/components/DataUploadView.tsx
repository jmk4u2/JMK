import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Save,
  BarChart,
  Table as TableIcon,
  ShieldAlert,
  HelpCircle,
  FolderOpen,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import {
  Course,
  CourseEvaluation,
  ColumnMappingConfig,
  ColumnType,
  MappingTemplate,
  ItemResult,
  AreaResult,
  PrePostAnalysis,
} from '../types';
import {
  readExcelFile,
  downloadSampleSurveyExcel,
  downloadSamplePrePostExcel,
} from '../utils/excelHelper';
import { calculateMean, calculateStdDev } from '../utils/statistics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface DataUploadViewProps {
  courses: Course[];
  activeCourseId: string | null;
  templates: MappingTemplate[];
  onSaveTemplate: (tpl: MappingTemplate) => void;
  onUpdateCourseEvaluation: (courseId: string, evaluation: CourseEvaluation) => void;
}

const PRESET_AREAS = ['교육내용', '강사평가', '교육운영', '교육환경', '기타'];

export const DataUploadView: React.FC<DataUploadViewProps> = ({
  courses,
  activeCourseId,
  templates,
  onSaveTemplate,
  onUpdateCourseEvaluation,
}) => {
  const surveyInputRef = useRef<HTMLInputElement>(null);
  const prePostInputRef = useRef<HTMLInputElement>(null);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  // Uploaded raw data state
  const [rawRows, setRawRows] = useState<any[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [mappings, setMappings] = useState<ColumnMappingConfig[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateNameInput, setTemplateNameInput] = useState<string>('');
  const [isMappingMode, setIsMappingMode] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Pre-post assessment raw data state
  const [prePostFileName, setPrePostFileName] = useState<string>('');
  const [prePostAnalysisResult, setPrePostAnalysisResult] = useState<PrePostAnalysis | null>(
    activeCourse?.evaluationData?.prePostAnalysis || null
  );

  // Sync evaluation state when activeCourse changes
  useEffect(() => {
    if (activeCourse?.evaluationData?.prePostAnalysis) {
      setPrePostAnalysisResult(activeCourse.evaluationData.prePostAnalysis);
    } else {
      setPrePostAnalysisResult(null);
    }
  }, [activeCourseId, activeCourse]);

  // Handle Survey File Upload
  const handleSurveyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data } = await readExcelFile(file);
      if (!data || data.length < 2) {
        alert('엑셀 파일에 데이터 행이 존재하지 않습니다.');
        return;
      }

      setFileName(file.name);
      const rawHeaderRow = data[0].map((h: any, i: number) => String(h || `열_${i + 1}`).trim());
      setHeaders(rawHeaderRow);
      setRawRows(data.slice(1));

      // Try auto-guessing mappings
      const initialMappings: ColumnMappingConfig[] = rawHeaderRow.map((header, idx) => {
        const lower = header.toLowerCase();
        let type: ColumnType = 'scale';
        let area = '교육내용';

        if (lower.includes('성명') || lower.includes('이름') || lower.includes('사번') || lower.includes('연락처') || lower.includes('이메일') || lower.includes('id')) {
          type = 'personal_id';
        } else if (lower.includes('순번') || lower.includes('no') || lower.includes('번호') || lower.includes('타임스탬프') || lower.includes('제출시간')) {
          type = 'ignore';
        } else if (lower.includes('주관식') || lower.includes('의견') || lower.includes('건의') || lower.includes('기타의견') || lower.includes('피드백') || lower.includes('서술')) {
          type = 'text';
        } else {
          type = 'scale';
          if (lower.includes('강사') || lower.includes('교수') || lower.includes('전달') || lower.includes('전문성')) {
            area = '강사평가';
          } else if (lower.includes('운영') || lower.includes('진행') || lower.includes('안내') || lower.includes('시간표')) {
            area = '교육운영';
          } else if (lower.includes('환경') || lower.includes('시설') || lower.includes('기자재') || lower.includes('강의실') || lower.includes('온도')) {
            area = '교육환경';
          } else {
            area = '교육내용';
          }
        }

        return {
          columnIndex: idx,
          columnHeader: header,
          type,
          areaName: area,
          scaleMax: 5,
        };
      });

      setMappings(initialMappings);
      setIsMappingMode(true);
      setStatusMessage(`[${file.name}] 파일이 로드되었습니다. (${data.length - 1}개 응답 행) 각 열의 역할을 확인해 주세요.`);
    } catch (err: any) {
      console.error(err);
      alert('엑셀 파일을 읽는 중 오류가 발생했습니다: ' + err.message);
    }
  };

  // Apply selected template
  const applyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;

    const newMappings = mappings.map((cur) => {
      // Find matching rule by header name or index
      const matched = tpl.mappings.find(
        (m) => m.columnHeader === cur.columnHeader || m.columnIndex === cur.columnIndex
      );
      if (matched) {
        return {
          ...cur,
          type: matched.type,
          areaName: matched.areaName || cur.areaName,
          scaleMax: matched.scaleMax || cur.scaleMax,
        };
      }
      return cur;
    });

    setMappings(newMappings);
    setStatusMessage(`[${tpl.name}] 매핑 양식이 성공적으로 적용되었습니다.`);
  };

  // Save current mappings as template
  const handleSaveCurrentAsTemplate = () => {
    if (!templateNameInput.trim()) {
      alert('저장할 매핑 양식의 이름을 입력해 주세요.');
      return;
    }
    const newTpl: MappingTemplate = {
      id: 'tpl_' + Date.now().toString(36),
      name: templateNameInput.trim(),
      createdAt: new Date().toISOString(),
      mappings: [...mappings],
    };
    onSaveTemplate(newTpl);
    setSelectedTemplateId(newTpl.id);
    setTemplateNameInput('');
    alert(`"${newTpl.name}" 매핑 양식이 저장되었습니다. 향후 언제든 재사용 가능합니다.`);
  };

  // Process Aggregation
  const handleExecuteAggregation = () => {
    if (!activeCourse) {
      alert('대상 교육과정을 먼저 선택해 주세요.');
      return;
    }
    if (!rawRows || rawRows.length === 0) {
      alert('집계할 데이터가 없습니다.');
      return;
    }

    // Find previous generation course of the same title for trend comparison
    const prevGenCourse = courses.find(
      (c) => c.title === activeCourse.title && c.generation === activeCourse.generation - 1
    );

    const scaleConfigs = mappings.filter((m) => m.type === 'scale');
    const textConfigs = mappings.filter((m) => m.type === 'text');

    if (scaleConfigs.length === 0) {
      alert('최소 1개 이상의 객관식(척도) 문항 열이 지정되어야 합니다.');
      return;
    }

    // Item results calculation
    const itemResults: ItemResult[] = scaleConfigs.map((cfg) => {
      const colValues: number[] = [];
      const distribution: { [score: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      rawRows.forEach((row) => {
        const val = Number(row[cfg.columnIndex]);
        if (!isNaN(val) && val > 0) {
          colValues.push(val);
          const roundedScore = Math.min(5, Math.max(1, Math.round(val)));
          distribution[roundedScore] = (distribution[roundedScore] || 0) + 1;
        }
      });

      const count = colValues.length;
      const mean = calculateMean(colValues);
      const stdDev = calculateStdDev(colValues, mean);

      const distributionPercent: { [score: number]: number } = {};
      [1, 2, 3, 4, 5].forEach((sc) => {
        distributionPercent[sc] = count > 0 ? Number(((distribution[sc] / count) * 100).toFixed(1)) : 0;
      });

      // Compare with previous generation item if matches
      let prevMean: number | undefined = undefined;
      let diffPrev: number | undefined = undefined;
      if (prevGenCourse?.evaluationData?.items) {
        const matchedPrevItem = prevGenCourse.evaluationData.items.find(
          (pi) => pi.columnHeader === cfg.columnHeader || pi.areaName === cfg.areaName
        );
        if (matchedPrevItem) {
          prevMean = matchedPrevItem.mean;
          diffPrev = Number((mean - prevMean).toFixed(2));
        }
      }

      return {
        columnHeader: cfg.columnHeader,
        areaName: cfg.areaName || '기타',
        mean,
        standardDeviation: stdDev,
        scaleMax: cfg.scaleMax || 5,
        responseCount: count,
        distribution,
        distributionPercent,
        previousMean: prevMean,
        diffPrevious: diffPrev,
      };
    });

    // Area results calculation
    const areaMap: { [area: string]: { sum: number; count: number } } = {};
    itemResults.forEach((it) => {
      if (!areaMap[it.areaName]) {
        areaMap[it.areaName] = { sum: 0, count: 0 };
      }
      areaMap[it.areaName].sum += it.mean;
      areaMap[it.areaName].count += 1;
    });

    const areaResults: AreaResult[] = Object.keys(areaMap).map((area) => {
      const mean = Number((areaMap[area].sum / areaMap[area].count).toFixed(2));
      let prevAreaMean: number | undefined = undefined;
      let diffPrevArea: number | undefined = undefined;

      if (prevGenCourse?.evaluationData?.areas) {
        const matchedPrevArea = prevGenCourse.evaluationData.areas.find((pa) => pa.areaName === area);
        if (matchedPrevArea) {
          prevAreaMean = matchedPrevArea.mean;
          diffPrevArea = Number((mean - prevAreaMean).toFixed(2));
        }
      }

      return {
        areaName: area,
        mean,
        itemCount: areaMap[area].count,
        previousMean: prevAreaMean,
        diffPrevious: diffPrevArea,
      };
    });

    // Overall mean
    const overallMean = Number(
      (itemResults.reduce((acc, it) => acc + it.mean, 0) / itemResults.length).toFixed(2)
    );

    let prevOverall: number | undefined = prevGenCourse?.evaluationData?.overallMean;
    let diffOverall: number | undefined =
      prevOverall !== undefined ? Number((overallMean - prevOverall).toFixed(2)) : undefined;

    // Collect subjective opinions (Strict privacy: ONLY text column strings, NO names/IDs)
    const subjectiveOpinions: string[] = [];
    textConfigs.forEach((cfg) => {
      rawRows.forEach((row) => {
        const text = String(row[cfg.columnIndex] || '').trim();
        if (text && text.length > 2 && text !== '없음' && text !== '무' && text !== '-') {
          subjectiveOpinions.push(text);
        }
      });
    });

    const respondentCount = rawRows.length;
    const responseRate =
      activeCourse.completionCount > 0
        ? Math.min(100, Number(((respondentCount / activeCourse.completionCount) * 100).toFixed(1)))
        : 100;

    const newEvaluation: CourseEvaluation = {
      courseId: activeCourse.id,
      surveyRespondentCount: respondentCount,
      responseRate,
      overallMean,
      previousOverallMean: prevOverall,
      diffPreviousOverall: diffOverall,
      scaleBase: 5,
      items: itemResults,
      areas: areaResults,
      subjectiveOpinions,
      subjectiveSummary: activeCourse.evaluationData?.subjectiveSummary,
      prePostAnalysis: prePostAnalysisResult || activeCourse.evaluationData?.prePostAnalysis,
      uploadedAt: new Date().toISOString(),
    };

    onUpdateCourseEvaluation(activeCourse.id, newEvaluation);
    setIsMappingMode(false);
    setStatusMessage(`설문 데이터 자동 집계가 완료되었습니다! (전체 만족도: ${overallMean}점, 응답자: ${respondentCount}명)`);
  };

  // Handle Pre/Post assessment file upload
  const handlePrePostUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data } = await readExcelFile(file);
      if (!data || data.length < 2) {
        alert('사전·사후 평가 엑셀에 데이터 행이 없습니다.');
        return;
      }

      setPrePostFileName(file.name);
      // Auto-detect pre and post score columns
      const headers = data[0].map((h: any) => String(h || '').trim());
      let preIdx = -1;
      let postIdx = -1;

      headers.forEach((h: string, idx: number) => {
        if (h.includes('사전') || h.includes('pre') || idx === 1) {
          if (preIdx === -1) preIdx = idx;
        }
        if (h.includes('사후') || h.includes('post') || idx === 2) {
          if (postIdx === -1) postIdx = idx;
        }
      });

      if (preIdx === -1 || postIdx === -1) {
        preIdx = 1;
        postIdx = 2;
      }

      const preScores: number[] = [];
      const postScores: number[] = [];
      const rows = data.slice(1);

      rows.forEach((r) => {
        const pre = Number(r[preIdx]);
        const post = Number(r[postIdx]);
        if (!isNaN(pre) && !isNaN(post)) {
          preScores.push(pre);
          postScores.push(post);
        }
      });

      if (preScores.length === 0) {
        alert('유효한 점수 데이터를 찾을 수 없습니다.');
        return;
      }

      const preMean = calculateMean(preScores);
      const postMean = calculateMean(postScores);
      const impMean = Number((postMean - preMean).toFixed(2));
      const impRate = preMean > 0 ? Number(((impMean / preMean) * 100).toFixed(1)) : 0;
      const preStd = calculateStdDev(preScores, preMean);
      const postStd = calculateStdDev(postScores, postMean);

      const analysis: PrePostAnalysis = {
        sampleCount: preScores.length,
        preMean,
        postMean,
        improvementMean: impMean,
        improvementRate: impRate,
        preStdDev: preStd,
        postStdDev: postStd,
      };

      setPrePostAnalysisResult(analysis);

      // If active course already has evaluation, update it directly
      if (activeCourse?.evaluationData) {
        const updated = {
          ...activeCourse.evaluationData,
          prePostAnalysis: analysis,
        };
        onUpdateCourseEvaluation(activeCourse.id, updated);
      }

      alert(`사전·사후 평가 집계 완료!\n사전 평균: ${preMean}점 → 사후 평균: ${postMean}점 (+${impMean}점, ${impRate}% 향상)`);
    } catch (err: any) {
      alert('사전·사후 평가 엑셀 처리 중 오류: ' + err.message);
    }
  };

  const evaluation = activeCourse?.evaluationData;

  // Chart data: Area comparison bar chart
  const areaChartData = evaluation?.areas
    ? {
        labels: evaluation.areas.map((a) => a.areaName),
        datasets: [
          {
            label: '현재 기수 만족도',
            data: evaluation.areas.map((a) => a.mean),
            backgroundColor: 'rgba(147, 51, 234, 0.85)', // Purple-600
            borderColor: 'rgb(147, 51, 234)',
            borderWidth: 1,
            borderRadius: 4,
          },
          ...(evaluation.areas.some((a) => a.previousMean !== undefined)
            ? [
                {
                  label: '전기 과정 만족도',
                  data: evaluation.areas.map((a) => a.previousMean || 0),
                  backgroundColor: 'rgba(148, 163, 184, 0.7)', // Slate-400
                  borderColor: 'rgb(148, 163, 184)',
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ]
            : []),
        ],
      }
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1-Line Usage Guide */}
      <div className="bg-purple-50/80 border border-purple-200/90 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-purple-950 shadow-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-purple-800">사용 방법:</span>
          <span>
            설문 엑셀을 업로드하고 <strong>[열 매핑]</strong>을 지정하면, 평균·표준편차·응답분포·전년대비 증감이 즉시 자동 계산됩니다.
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={downloadSampleSurveyExcel}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium rounded shadow-xs transition cursor-pointer"
          >
            <Download className="w-3 h-3 text-purple-600" />
            샘플 설문 엑셀 다운로드
          </button>
          <button
            onClick={downloadSamplePrePostExcel}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded shadow-xs transition cursor-pointer"
          >
            <Download className="w-3 h-3 text-emerald-600" />
            샘플 성취도 엑셀
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
        <div>
          <strong className="text-slate-800 font-semibold">[공공기관 개인정보 보호 원칙 적용]</strong>
          <span className="ml-1">
            업로드된 엑셀 파일은 브라우저 메모리 내에서만 즉시 집계되며 외부 서버로 전송되지 않습니다.
            성명, 사번, 연락처 등 개인 식별 열은 통계 집계와 저장에서 원천 제외됩니다.
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            닫기
          </button>
        </div>
      )}

      {/* Current Course Context Banner */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">집계 대상 교육과정</span>
          <h2 className="text-base font-bold text-slate-900">
            {activeCourse ? `${activeCourse.title} (${activeCourse.generation}기)` : '과정을 선택하세요'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Survey Upload Button */}
          <button
            onClick={() => surveyInputRef.current?.click()}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-md shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            만족도 설문 엑셀 업로드
          </button>
          <input
            type="file"
            ref={surveyInputRef}
            onChange={handleSurveyFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Pre/Post Upload Button */}
          <button
            onClick={() => prePostInputRef.current?.click()}
            className="px-3.5 py-2 bg-purple-950 hover:bg-purple-900 text-white text-xs font-medium rounded-md shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-300" />
            사전·사후 평가 엑셀 (선택)
          </button>
          <input
            type="file"
            ref={prePostInputRef}
            onChange={handlePrePostUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
        </div>
      </div>

      {/* Column Mapping Mode Interface */}
      {isMappingMode && headers.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-purple-600 shadow-md p-5 space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  단계 2: 열 매핑 설정
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  [{fileName}] 열 유형 및 영역 지정
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                각 열의 데이터 성격을 지정하세요. 개인정보 열은 자동으로 제외되며 통계에 포함되지 않습니다.
              </p>
            </div>

            {/* Template Selector & Save */}
            <div className="flex flex-wrap items-center gap-2">
              {templates.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="">저장된 양식 불러오기...</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Mapping Grid Table */}
          <div className="overflow-x-auto max-h-[380px] border border-slate-200 rounded">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 z-10 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">번호</th>
                  <th className="py-2.5 px-3 w-56">엑셀 열 제목</th>
                  <th className="py-2.5 px-3 w-40">열 역할 분류</th>
                  <th className="py-2.5 px-3 w-36">평가 영역</th>
                  <th className="py-2.5 px-3 w-28">만점 척도</th>
                  <th className="py-2.5 px-3">데이터 미리보기 (1행)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mappings.map((cfg, idx) => {
                  const sampleVal = rawRows && rawRows[0] ? String(rawRows[0][idx] || '') : '';

                  return (
                    <tr
                      key={idx}
                      className={
                        cfg.type === 'personal_id'
                          ? 'bg-rose-50/50'
                          : cfg.type === 'ignore'
                          ? 'bg-slate-50 text-slate-400'
                          : cfg.type === 'text'
                          ? 'bg-amber-50/40'
                          : 'hover:bg-blue-50/30'
                      }
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        <div className="truncate max-w-[220px]" title={cfg.columnHeader}>
                          {cfg.columnHeader}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={cfg.type}
                          onChange={(e) => {
                            const newType = e.target.value as ColumnType;
                            setMappings((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, type: newType } : m))
                            );
                          }}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="scale">객관식 문항 (척도)</option>
                          <option value="text">주관식 의견 (텍스트)</option>
                          <option value="personal_id">개인정보 (집계제외)</option>
                          <option value="ignore">무시 / 기타</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        {cfg.type === 'scale' ? (
                          <input
                            type="text"
                            list="preset-areas"
                            value={cfg.areaName || '교육내용'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMappings((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, areaName: val } : m))
                              );
                            }}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                            placeholder="영역 입력"
                          />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {cfg.type === 'scale' ? (
                          <select
                            value={cfg.scaleMax || 5}
                            onChange={(e) => {
                              const scale = Number(e.target.value) as 5 | 7 | 10;
                              setMappings((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, scaleMax: scale } : m))
                              );
                            }}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value={5}>5점 척도</option>
                            <option value={7}>7점 척도</option>
                            <option value={10}>10점 척도</option>
                          </select>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-[200px]" title={sampleVal}>
                        {cfg.type === 'personal_id' ? (
                          <span className="text-rose-600 font-medium">*** [비식별화 보호]</span>
                        ) : (
                          sampleVal || <span className="text-slate-300">(빈값)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <datalist id="preset-areas">
            {PRESET_AREAS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="현재 매핑 양식 이름 (예: 연수원 표준)"
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1.5 text-xs w-56"
              />
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 inline-flex items-center gap-1 transition"
              >
                <Save className="w-3.5 h-3.5" />
                양식으로 저장
              </button>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsMappingMode(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 border border-slate-300 rounded transition"
              >
                매핑 닫기
              </button>
              <button
                type="button"
                onClick={handleExecuteAggregation}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                자동 집계 실행하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aggregated Results Display */}
      {evaluation ? (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">전체 만족도 종합</div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-purple-800">
                  {evaluation.overallMean.toFixed(2)}
                  <span className="text-sm font-normal text-slate-500 ml-1">/ 5.0</span>
                </div>
                {evaluation.diffPreviousOverall !== undefined && (
                  <div
                    className={`text-xs font-bold flex items-center ${
                      evaluation.diffPreviousOverall > 0
                        ? 'text-emerald-600'
                        : evaluation.diffPreviousOverall < 0
                        ? 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {evaluation.diffPreviousOverall > 0
                      ? `▲ +${evaluation.diffPreviousOverall.toFixed(2)}`
                      : evaluation.diffPreviousOverall < 0
                      ? `▼ ${evaluation.diffPreviousOverall.toFixed(2)}`
                      : '0.00'}
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">(전기대비)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">설문 응답률</div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-slate-900">
                  {evaluation.responseRate}%
                </div>
                <span className="text-xs text-slate-500">
                  {evaluation.surveyRespondentCount}명 응답
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">평가 문항수 및 영역</div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-slate-900">
                  {evaluation.items.length}개
                </div>
                <span className="text-xs text-slate-500">{evaluation.areas.length}개 영역 분류</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">학업성취도 향상률</div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-emerald-700">
                  {evaluation.prePostAnalysis ? `+${evaluation.prePostAnalysis.improvementRate}%` : '-'}
                </div>
                <span className="text-xs text-slate-500">
                  {evaluation.prePostAnalysis
                    ? `+${evaluation.prePostAnalysis.improvementMean}점 상승`
                    : '사전사후 미등록'}
                </span>
              </div>
            </div>
          </div>

          {/* Area Chart & Pre-Post Summary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Comparison Bar Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">영역별 만족도 평균 분석</h3>
                  <p className="text-xs text-slate-500">5.0점 만점 척도 기준</p>
                </div>
              </div>
              <div className="h-64">
                {areaChartData && (
                  <Bar
                    data={areaChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          min: 3.0,
                          max: 5.0,
                          ticks: { stepSize: 0.5 },
                        },
                      },
                      plugins: {
                        legend: { position: 'top' as const },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Pre/Post Achievement Summary Box */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">학업성취도 (사전·사후 평가)</h3>
                  {evaluation.prePostAnalysis && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                      Kirkpatrick 2단계(학습)
                    </span>
                  )}
                </div>

                {evaluation.prePostAnalysis ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <div className="text-xs text-slate-500">사전 평가 평균</div>
                        <div className="text-xl font-bold text-slate-700 mt-0.5">
                          {evaluation.prePostAnalysis.preMean}점
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <div className="text-xs text-blue-700">사후 평가 평균</div>
                        <div className="text-xl font-bold text-blue-900 mt-0.5">
                          {evaluation.prePostAnalysis.postMean}점
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded text-xs text-emerald-900 space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>점수 향상폭:</span>
                        <span>+{evaluation.prePostAnalysis.improvementMean}점</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>성취 향상률:</span>
                        <span>+{evaluation.prePostAnalysis.improvementRate}% 증진</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/60 mt-1">
                        * 평가인원: {evaluation.prePostAnalysis.sampleCount}명 기준 (100점 만점 환산)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                    <p>사전·사후 성취도 데이터가 등록되지 않았습니다.</p>
                    <p className="text-[11px] text-slate-400">
                      상단의 [사전·사후 평가 엑셀] 버튼을 통해 학업 성취도 데이터를 연계할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3">
                <button
                  onClick={() => prePostInputRef.current?.click()}
                  className="w-full py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-medium transition"
                >
                  {evaluation.prePostAnalysis ? '사전·사후 파일 재업로드' : '사전·사후 파일 업로드'}
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Item Results Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">문항별 상세 만족도 집계표</h3>
                <p className="text-xs text-slate-500">
                  평균, 표준편차, 1~5점 백분율 응답 분포 및 전기 과정 대비 증감
                </p>
              </div>
              <button
                onClick={() => setIsMappingMode(true)}
                className="px-2.5 py-1 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                열 매핑 다시 열기
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-24">영역</th>
                    <th className="py-2.5 px-3">설문 평가 문항</th>
                    <th className="py-2.5 px-3 text-right w-16">평균</th>
                    <th className="py-2.5 px-3 text-right w-16">표준편차</th>
                    <th className="py-2.5 px-3 text-center w-20">전기 대비</th>
                    <th className="py-2.5 px-3 text-center w-48">응답 분포 (1점 ~ 5점 비율)</th>
                    <th className="py-2.5 px-3 text-right w-16">응답수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {evaluation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/20">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <span className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-purple-100">
                          {item.areaName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{item.columnHeader}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-purple-800 text-sm">
                        {item.mean.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                        {item.standardDeviation.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.diffPrevious !== undefined ? (
                          <span
                            className={`font-semibold text-xs ${
                              item.diffPrevious > 0
                                ? 'text-emerald-600'
                                : item.diffPrevious < 0
                                ? 'text-rose-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.diffPrevious > 0
                              ? `▲ +${item.diffPrevious.toFixed(2)}`
                              : item.diffPrevious < 0
                              ? `▼ ${item.diffPrevious.toFixed(2)}`
                              : '0.00'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-[10px]">
                          {/* 5-scale bar mini visualization */}
                          <div className="flex h-3 w-full bg-slate-100 rounded overflow-hidden">
                            <div
                              style={{ width: `${item.distributionPercent[1] || 0}%` }}
                              title={`1점: ${item.distributionPercent[1]}%`}
                              className="bg-rose-400"
                            />
                            <div
                              style={{ width: `${item.distributionPercent[2] || 0}%` }}
                              title={`2점: ${item.distributionPercent[2]}%`}
                              className="bg-amber-300"
                            />
                            <div
                              style={{ width: `${item.distributionPercent[3] || 0}%` }}
                              title={`3점: ${item.distributionPercent[3]}%`}
                              className="bg-slate-300"
                            />
                            <div
                              style={{ width: `${item.distributionPercent[4] || 0}%` }}
                              title={`4점: ${item.distributionPercent[4]}%`}
                              className="bg-purple-300"
                            />
                            <div
                              style={{ width: `${item.distributionPercent[5] || 0}%` }}
                              title={`5점: ${item.distributionPercent[5]}%`}
                              className="bg-purple-600"
                            />
                          </div>
                          <span className="text-slate-500 font-mono shrink-0 ml-1">
                            5점:{item.distributionPercent[5]}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{item.responseCount}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subjective Opinions List */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  수료생 주관식 설문 의견 ({evaluation.subjectiveOpinions.length}건)
                </h3>
              </div>
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                개인을 특정할 수 있는 내용이 포함될 수 있으므로 공유 시 유의 바랍니다.
              </span>
            </div>

            {evaluation.subjectiveOpinions.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {evaluation.subjectiveOpinions.map((op, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2"
                  >
                    <span className="font-semibold text-slate-400 shrink-0 font-mono">#{idx + 1}</span>
                    <p className="grow">{op}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">등록된 주관식 의견이 없습니다.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">평가 데이터가 아직 등록되지 않았습니다</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            설문 응답 엑셀 파일을 업로드하면 문항별·영역별 만족도 통계가 즉각 집계됩니다.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => surveyInputRef.current?.click()}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded shadow-xs transition inline-flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              만족도 설문 엑셀 올리기
            </button>
            <button
              onClick={downloadSampleSurveyExcel}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded transition inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-blue-600" />
              표준 설문 양식 내려받기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
