import React, { useState, useEffect } from 'react';
import {
  Save,
  Copy,
  Trash2,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Building,
  Calendar,
} from 'lucide-react';
import { Course, OperationMode } from '../types';

interface CourseFormViewProps {
  courses: Course[];
  activeCourseId: string | null;
  onSaveCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onSelectCourse: (courseId: string) => void;
}

export const CourseFormView: React.FC<CourseFormViewProps> = ({
  courses,
  activeCourseId,
  onSaveCourse,
  onDeleteCourse,
  onSelectCourse,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | 'new'>(activeCourseId || 'new');
  const [copySourceId, setCopySourceId] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [generation, setGeneration] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [objectives, setObjectives] = useState('');
  const [operationMode, setOperationMode] = useState<OperationMode>('집합');
  const [totalHours, setTotalHours] = useState(35);
  const [targetCount, setTargetCount] = useState(30);
  const [completionCount, setCompletionCount] = useState(30);
  const [managerName, setManagerName] = useState('');
  const [managerDepartment, setManagerDepartment] = useState('');

  // Auto calculate completion rate
  const completionRate =
    targetCount > 0 ? Number(((completionCount / targetCount) * 100).toFixed(1)) : 0;

  // Sync form when selected course changes
  useEffect(() => {
    if (selectedCourseId === 'new') {
      setTitle('');
      setGeneration(1);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 4);
      setStartDate(today.toISOString().slice(0, 10));
      setEndDate(nextWeek.toISOString().slice(0, 10));
      setTargetAudience('');
      setObjectives('');
      setOperationMode('집합');
      setTotalHours(35);
      setTargetCount(30);
      setCompletionCount(30);
      setManagerName('');
      setManagerDepartment('');
    } else {
      const c = courses.find((item) => item.id === selectedCourseId);
      if (c) {
        setTitle(c.title);
        setGeneration(c.generation);
        setStartDate(c.startDate);
        setEndDate(c.endDate);
        setTargetAudience(c.targetAudience);
        setObjectives(c.objectives);
        setOperationMode(c.operationMode);
        setTotalHours(c.totalHours);
        setTargetCount(c.targetCount);
        setCompletionCount(c.completionCount);
        setManagerName(c.managerName);
        setManagerDepartment(c.managerDepartment);
      }
    }
  }, [selectedCourseId, courses]);

  // Handle Copy from previous course
  const handleCopyFromSource = () => {
    if (!copySourceId) return;
    const source = courses.find((c) => c.id === copySourceId);
    if (!source) return;

    setTitle(source.title);
    setGeneration(source.generation + 1); // 다음 기수로 자동 증가
    setTargetAudience(source.targetAudience);
    setObjectives(source.objectives);
    setOperationMode(source.operationMode);
    setTotalHours(source.totalHours);
    setTargetCount(source.targetCount);
    setCompletionCount(source.targetCount);
    setManagerName(source.managerName);
    setManagerDepartment(source.managerDepartment);

    setSelectedCourseId('new');
    setAlertMessage(`[${source.title} (${source.generation}기)]의 정보를 복사하여 ${source.generation + 1}기 등록 양식을 구성했습니다. 기간과 인원을 입력 후 저장해 주세요.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('과정명을 입력해 주세요.');
      return;
    }
    if (!startDate || !endDate) {
      alert('교육 시작일과 종료일을 지정해 주세요.');
      return;
    }

    const existing = selectedCourseId !== 'new' ? courses.find((c) => c.id === selectedCourseId) : null;

    const courseToSave: Course = {
      id: existing ? existing.id : 'course-' + Date.now().toString(36),
      title: title.trim(),
      generation: Number(generation) || 1,
      startDate,
      endDate,
      targetAudience: targetAudience.trim(),
      objectives: objectives.trim(),
      operationMode,
      totalHours: Number(totalHours) || 0,
      targetCount: Number(targetCount) || 0,
      completionCount: Number(completionCount) || 0,
      completionRate,
      managerName: managerName.trim(),
      managerDepartment: managerDepartment.trim(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evaluationData: existing?.evaluationData,
    };

    onSaveCourse(courseToSave);
    onSelectCourse(courseToSave.id);
    setSelectedCourseId(courseToSave.id);
    setAlertMessage(`"${courseToSave.title} (${courseToSave.generation}기)" 과정이 성공적으로 저장되었습니다.`);
  };

  const handleDelete = () => {
    if (selectedCourseId === 'new') return;
    const target = courses.find((c) => c.id === selectedCourseId);
    if (!target) return;

    if (window.confirm(`정말로 "${target.title} (${target.generation}기)" 과정을 삭제하시겠습니까?\n연계된 평가 데이터도 함께 삭제됩니다.`)) {
      onDeleteCourse(target.id);
      setSelectedCourseId('new');
      setAlertMessage('해당 과정이 안전하게 삭제되었습니다.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1-Line Usage Guide */}
      <div className="bg-purple-50/80 border border-purple-200/90 rounded-lg p-3.5 flex items-center justify-between text-sm text-purple-950 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-purple-800">사용 방법:</span>
          <span>
            기본 과정 개요를 등록하거나, <strong>"이전 과정 복사"</strong>를 통해 동일 과정의 차기 기수를 손쉽게 생성할 수 있습니다.
          </span>
        </div>
      </div>

      {alertMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            닫기
          </button>
        </div>
      )}

      {/* Course Selection & Copy Banner */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">작업 대상 과정:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              if (e.target.value !== 'new') {
                onSelectCourse(e.target.value);
              }
            }}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="new">+ 새 과정 신규 등록</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.generation}기)
              </option>
            ))}
          </select>
        </div>

        {/* Previous Course Copy Toolbar */}
        {courses.length > 0 && (
          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <span className="text-xs text-slate-500 whitespace-nowrap">이전 과정 복사:</span>
            <select
              value={copySourceId}
              onChange={(e) => setCopySourceId(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
            >
              <option value="">복사할 기존 과정 선택</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.generation}기)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCopyFromSource}
              disabled={!copySourceId}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded disabled:opacity-40 inline-flex items-center gap-1 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              차기 기수로 복사
            </button>
          </div>
        )}
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {selectedCourseId === 'new' ? '신규 교육과정 개요 등록' : '교육과정 정보 수정'}
          </h3>
          <span className="text-xs text-slate-500">
            * 입력된 정보는 결과보고서 제1장 과정 개요에 자동으로 반영됩니다.
          </span>
        </div>

        {/* Row 1: Course Title & Generation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              과정명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 2026년 공공기관 신임실무자 역량강화과정"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              기수 <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min={1}
                required
                value={generation}
                onChange={(e) => setGeneration(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold"
              />
              <span className="ml-2 text-sm text-slate-600 whitespace-nowrap">기</span>
            </div>
          </div>
        </div>

        {/* Row 2: Dates, Operation Mode, Hours */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              교육 시작일 <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              교육 종료일 <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              운영방식 <span className="text-rose-500">*</span>
            </label>
            <select
              value={operationMode}
              onChange={(e) => setOperationMode(e.target.value as OperationMode)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="집합">집합 (대면 집체교육)</option>
              <option value="원격">원격 (실시간 화상/이러닝)</option>
              <option value="혼합">혼합 (블렌디드 러닝)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              총 교육시간 (시간) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min={1}
                required
                value={totalHours}
                onChange={(e) => setTotalHours(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <span className="ml-2 text-xs text-slate-600 whitespace-nowrap">시간</span>
            </div>
          </div>
        </div>

        {/* Row 3: Target Audience & Objectives */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              교육대상
            </label>
            <input
              type="text"
              placeholder="예: 공공기관 신규 임용자 및 실무자 (재직 1년 미만)"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              교육목표
            </label>
            <input
              type="text"
              placeholder="예: 공직 가치 확립, 기획보고서 작성 실무 및 갈등관리 역량 제고"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 4: Participants & Completion Rate (Auto Calculation) */}
        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                계획 교육인원 (명)
              </label>
              <input
                type="number"
                min={0}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                최종 수료인원 (명)
              </label>
              <input
                type="number"
                min={0}
                value={completionCount}
                onChange={(e) => setCompletionCount(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                수료율 (자동 계산)
              </label>
              <div className="flex items-center justify-center bg-white border border-purple-200 rounded-md px-3 py-2 text-xs font-bold text-purple-800">
                {completionRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Manager Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              담당부서
            </label>
            <input
              type="text"
              placeholder="예: 인재개발원 교육기획부"
              value={managerDepartment}
              onChange={(e) => setManagerDepartment(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              담당자 성명 및 직급
            </label>
            <input
              type="text"
              placeholder="예: 김진호 주임 / 박은혜 대리"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {selectedCourseId !== 'new' && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md inline-flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                이 과정 삭제
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCourseId('new')}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-md transition"
            >
              입력 초기화
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-md shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {selectedCourseId === 'new' ? '과정 등록 완료' : '수정사항 저장'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
