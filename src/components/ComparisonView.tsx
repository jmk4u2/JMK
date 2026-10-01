import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  BarChart3,
  CheckSquare,
  Square,
  Download,
  Copy,
  Check,
  Layers,
  ArrowUpRight,
  Camera,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { Course } from '../types';
import { copyHtmlTableToClipboard } from '../utils/clipboardHelper';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ComparisonViewProps {
  courses: Course[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ courses }) => {
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    courses.map((c) => c.id)
  );
  const [copiedTable, setCopiedTable] = useState(false);

  const barChartRef = useRef<any>(null);
  const lineChartRef = useRef<any>(null);

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedCourseIds(courses.map((c) => c.id));
  const deselectAll = () => setSelectedCourseIds([]);

  const comparedCourses = courses.filter((c) => selectedCourseIds.includes(c.id));

  // Collect unique areas from compared courses
  const allAreas = Array.from(
    new Set(
      comparedCourses.flatMap((c) => c.evaluationData?.areas.map((a) => a.areaName) || [])
    )
  );

  // Palette for datasets
  const colors = [
    { bg: 'rgba(147, 51, 234, 0.85)', border: 'rgb(147, 51, 234)' }, // Purple-600
    { bg: 'rgba(99, 102, 241, 0.85)', border: 'rgb(99, 102, 241)' }, // Indigo-500
    { bg: 'rgba(217, 70, 239, 0.85)', border: 'rgb(217, 70, 239)' }, // Fuchsia-500
    { bg: 'rgba(16, 185, 129, 0.85)', border: 'rgb(16, 185, 129)' }, // Emerald-500
    { bg: 'rgba(245, 158, 11, 0.85)', border: 'rgb(245, 158, 11)' }, // Amber-500
  ];

  // Chart 1: Bar chart comparing Area Satisfaction across courses
  const areaComparisonData = {
    labels: allAreas.length > 0 ? allAreas : ['교육내용', '강사평가', '교육운영', '교육환경'],
    datasets: comparedCourses.map((c, idx) => {
      const color = colors[idx % colors.length];
      const areaMeans = (allAreas.length > 0 ? allAreas : ['교육내용', '강사평가', '교육운영', '교육환경']).map(
        (area) => {
          const matched = c.evaluationData?.areas.find((a) => a.areaName === area);
          return matched ? matched.mean : 0;
        }
      );
      return {
        label: `${c.title} (${c.generation}기)`,
        data: areaMeans,
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 1,
        borderRadius: 4,
      };
    }),
  };

  // Chart 2: Trend Line Chart sorted chronologically
  const sortedCourses = [...comparedCourses].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  const trendLabels = sortedCourses.map((c) => `${c.title.slice(0, 10)}.. (${c.generation}기)`);

  const trendLineData = {
    labels: trendLabels,
    datasets: [
      {
        label: '전체 만족도 (5점 만점)',
        data: sortedCourses.map((c) => c.evaluationData?.overallMean || null),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        yAxisID: 'ySatisfaction',
        tension: 0.2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: '수료율 (%)',
        data: sortedCourses.map((c) => c.completionRate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'yPercent',
        borderDash: [5, 5],
        tension: 0.2,
        pointRadius: 4,
      },
      {
        label: '성취도 향상률 (%)',
        data: sortedCourses.map((c) => c.evaluationData?.prePostAnalysis?.improvementRate || null),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        yAxisID: 'yPercent',
        tension: 0.2,
        pointRadius: 4,
      },
    ],
  };

  // Download chart as PNG
  const downloadChartPng = (chartRef: any, fileName: string) => {
    if (!chartRef.current) return;
    const canvas = chartRef.current.canvas;
    const imageUri = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = imageUri;
    a.download = `${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy Comparison Table as HTML for Hangul (HWP)
  const handleCopyComparisonTable = async () => {
    const tableHtml = `
      <table border="1" style="border-collapse:collapse; width:100%; text-align:center;">
        <thead style="background:#f1f5f9;">
          <tr>
            <th>과정명 및 기수</th>
            <th>교육기간</th>
            <th>운영방식</th>
            <th>교육인원</th>
            <th>수료율</th>
            <th>전체 만족도</th>
            <th>성취도 향상률</th>
          </tr>
        </thead>
        <tbody>
          ${comparedCourses
            .map(
              (c) => `<tr>
              <td style="text-align:left;">${c.title} (${c.generation}기)</td>
              <td>${c.startDate} ~ ${c.endDate}</td>
              <td>${c.operationMode}</td>
              <td>${c.completionCount}/${c.targetCount}명</td>
              <td><strong>${c.completionRate}%</strong></td>
              <td style="text-align:right;"><strong>${c.evaluationData?.overallMean ? c.evaluationData.overallMean.toFixed(2) + '점' : '-'}</strong></td>
              <td style="text-align:right;">${c.evaluationData?.prePostAnalysis ? '+' + c.evaluationData.prePostAnalysis.improvementRate + '%' : '-'}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `;

    const plain = comparedCourses
      .map(
        (c) =>
          `${c.title} (${c.generation}기) | 수료율: ${c.completionRate}% | 만족도: ${
            c.evaluationData?.overallMean || '-'
          }점`
      )
      .join('\n');

    const ok = await copyHtmlTableToClipboard(tableHtml, plain);
    if (ok) {
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2500);
    }
  };

  // Download comparison table as Excel
  const handleDownloadExcel = () => {
    const rows = comparedCourses.map((c) => ({
      과정명: c.title,
      기수: c.generation,
      교육기간: `${c.startDate} ~ ${c.endDate}`,
      운영방식: c.operationMode,
      교육시간: c.totalHours,
      계획인원: c.targetCount,
      수료인원: c.completionCount,
      수료율: c.completionRate + '%',
      전체만족도: c.evaluationData?.overallMean || 0,
      설문응답자: c.evaluationData?.surveyRespondentCount || 0,
      성취도사전평균: c.evaluationData?.prePostAnalysis?.preMean || '-',
      성취도사후평균: c.evaluationData?.prePostAnalysis?.postMean || '-',
      성취도향상률: c.evaluationData?.prePostAnalysis ? c.evaluationData.prePostAnalysis.improvementRate + '%' : '-',
      담당자: `${c.managerDepartment} ${c.managerName}`,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '과정성과비교');
    XLSX.writeFile(wb, '연수교육과정_성과비교분석.xlsx');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1-Line Usage Guide */}
      <div className="bg-purple-50/80 border border-purple-200/90 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-purple-950 shadow-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-purple-800">사용 방법:</span>
          <span>
            비교를 원하는 과정을 선택하면 <strong>영역별 만족도 비교</strong>와 <strong>기수별 추이 변화선</strong>을 한눈에 파악할 수 있습니다.
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopyComparisonTable}
            className={`px-3 py-1 text-xs font-medium rounded border inline-flex items-center gap-1 transition cursor-pointer ${
              copiedTable
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-white hover:bg-purple-50 text-purple-900 border-purple-200'
            }`}
          >
            {copiedTable ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-purple-600" />}
            {copiedTable ? '한글 표 복사됨' : '한글(HWP) 표 복사'}
          </button>
          <button
            onClick={handleDownloadExcel}
            className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded shadow-xs inline-flex items-center gap-1 transition cursor-pointer"
          >
            <Download className="w-3 h-3 text-emerald-600" />
            비교 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* Course Selection Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            비교 분석 대상 과정 선택 ({comparedCourses.length}/{courses.length}개 선택됨)
          </span>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={selectAll}
              className="text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
            >
              전체 선택
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={deselectAll}
              className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
            >
              전체 해제
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {courses.map((c) => {
            const isChecked = selectedCourseIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCourse(c.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-2 transition cursor-pointer ${
                  isChecked
                    ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {c.title} ({c.generation}기)
                </span>
                <span className="text-[11px] text-purple-700/80">
                  {c.evaluationData?.overallMean ? `${c.evaluationData.overallMean.toFixed(2)}점` : '미집계'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {comparedCourses.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-xs text-slate-500">
          비교할 교육과정을 1개 이상 선택해 주세요.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Bar Chart (Area Satisfaction Comparison) */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">영역별 만족도 비교</h3>
                  <p className="text-xs text-slate-500">과정 간 영역별 평균 점수 대조 (5점 만점)</p>
                </div>
                <button
                  onClick={() => downloadChartPng(barChartRef, '영역별_만족도_비교차트')}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded text-xs inline-flex items-center gap-1 transition"
                  title="차트를 PNG 고화질 이미지로 저장"
                >
                  <Camera className="w-3 h-3 text-blue-600" />
                  PNG 저장
                </button>
              </div>

              <div className="h-72">
                <Bar
                  ref={barChartRef}
                  data={areaComparisonData}
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
              </div>
            </div>

            {/* Chart 2: Trend Line Chart */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">기수별·과정별 성과 추이 곡선</h3>
                  <p className="text-xs text-slate-500">만족도와 수료율, 학업성취도의 연계 추이</p>
                </div>
                <button
                  onClick={() => downloadChartPng(lineChartRef, '과정별_성과추이_비교차트')}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded text-xs inline-flex items-center gap-1 transition"
                  title="차트를 PNG 고화질 이미지로 저장"
                >
                  <Camera className="w-3 h-3 text-blue-600" />
                  PNG 저장
                </button>
              </div>

              <div className="h-72">
                <Line
                  ref={lineChartRef}
                  data={trendLineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      ySatisfaction: {
                        type: 'linear',
                        position: 'left',
                        min: 3.5,
                        max: 5.0,
                        title: { display: true, text: '만족도 (점)' },
                      },
                      yPercent: {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 100,
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: '비율 (%)' },
                      },
                    },
                    plugins: {
                      legend: { position: 'top' as const },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Comparison Summary Matrix Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">선택 과정 종합 성과 비교표</h3>
                <p className="text-xs text-slate-500">
                  교육실적, 수료율, 종합만족도 및 Kirkpatrick 성취도 비교
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">과정명 및 기수</th>
                    <th className="py-2.5 px-3">교육기간</th>
                    <th className="py-2.5 px-3 text-center">운영방식</th>
                    <th className="py-2.5 px-3 text-center">교육/수료인원</th>
                    <th className="py-2.5 px-3 text-center">수료율</th>
                    <th className="py-2.5 px-3 text-center">전체 만족도</th>
                    <th className="py-2.5 px-3 text-center">학업성취 향상률</th>
                    <th className="py-2.5 px-3">담당자</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {comparedCourses.map((c) => {
                    const evalData = c.evaluationData;
                    return (
                      <tr key={c.id} className="hover:bg-blue-50/20">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {c.title} ({c.generation}기)
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {c.startDate} ~ {c.endDate}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {c.operationMode} ({c.totalHours}H)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold">{c.completionCount}</span> / {c.targetCount}명
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {c.completionRate}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          {evalData?.overallMean ? (
                            <div className="font-extrabold text-blue-700">
                              {evalData.overallMean.toFixed(2)}점
                              {evalData.diffPreviousOverall !== undefined && (
                                <span
                                  className={`text-[10px] ml-1 font-semibold ${
                                    evalData.diffPreviousOverall > 0
                                      ? 'text-emerald-600'
                                      : evalData.diffPreviousOverall < 0
                                      ? 'text-rose-600'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {evalData.diffPreviousOverall > 0
                                    ? `▲+${evalData.diffPreviousOverall.toFixed(2)}`
                                    : evalData.diffPreviousOverall < 0
                                    ? `▼${evalData.diffPreviousOverall.toFixed(2)}`
                                    : '0.00'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {evalData?.prePostAnalysis ? (
                            <span className="font-bold text-emerald-700">
                              +{evalData.prePostAnalysis.improvementRate}%
                              <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                                (+{evalData.prePostAnalysis.improvementMean}점)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {c.managerName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
