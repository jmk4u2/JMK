import React, { useState, useEffect } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CourseFormView } from './components/CourseFormView';
import { DataUploadView } from './components/DataUploadView';
import { ReportView } from './components/ReportView';
import { ComparisonView } from './components/ComparisonView';
import { Course, CourseEvaluation, MappingTemplate } from './types';
import {
  getStoredCourses,
  saveCourses,
  getStoredTemplates,
  saveTemplates,
  getActiveCourseId,
  setActiveCourseId,
  clearAllStorage,
  getInitialSampleCourses,
} from './utils/storage';
import { exportTeamDataExcel, importTeamDataExcel } from './utils/excelHelper';

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseIdState] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const [aiAvailable, setAiAvailable] = useState<boolean>(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedCourses = getStoredCourses();
    setCourses(loadedCourses);

    const savedActiveId = getActiveCourseId();
    if (savedActiveId && loadedCourses.some((c) => c.id === savedActiveId)) {
      setActiveCourseIdState(savedActiveId);
    } else if (loadedCourses.length > 0) {
      setActiveCourseIdState(loadedCourses[0].id);
      setActiveCourseId(loadedCourses[0].id);
    }

    setTemplates(getStoredTemplates());

    // Check AI availability from backend
    fetch('/api/ai-status')
      .then((res) => res.json())
      .then((data) => {
        setAiAvailable(!!data.available);
      })
      .catch(() => {
        setAiAvailable(false);
      });
  }, []);

  // Update active course
  const handleSelectCourse = (courseId: string) => {
    setActiveCourseIdState(courseId);
    setActiveCourseId(courseId);
  };

  // Save/Update course
  const handleSaveCourse = (updatedCourse: Course) => {
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === updatedCourse.id);
      let next: Course[];
      if (exists) {
        next = prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
      } else {
        next = [updatedCourse, ...prev];
      }
      saveCourses(next);
      return next;
    });
    handleSelectCourse(updatedCourse.id);
  };

  // Delete course
  const handleDeleteCourse = (courseId: string) => {
    setCourses((prev) => {
      const next = prev.filter((c) => c.id !== courseId);
      saveCourses(next);
      if (activeCourseId === courseId) {
        const fallback = next.length > 0 ? next[0].id : null;
        setActiveCourseIdState(fallback);
        if (fallback) setActiveCourseId(fallback);
      }
      return next;
    });
  };

  // Save template
  const handleSaveTemplate = (tpl: MappingTemplate) => {
    setTemplates((prev) => {
      const next = [tpl, ...prev.filter((t) => t.id !== tpl.id)];
      saveTemplates(next);
      return next;
    });
  };

  // Update evaluation data
  const handleUpdateCourseEvaluation = (courseId: string, evaluation: CourseEvaluation) => {
    setCourses((prev) => {
      const next = prev.map((c) =>
        c.id === courseId ? { ...c, evaluationData: evaluation, updatedAt: new Date().toISOString() } : c
      );
      saveCourses(next);
      return next;
    });
  };

  // Load sample courses
  const handleLoadSampleData = () => {
    if (
      courses.length > 0 &&
      !window.confirm('기존 데이터에 가상의 3개 샘플 과정과 만족도·성취도 데이터를 추가/갱신하시겠습니까?')
    ) {
      return;
    }
    const sample = getInitialSampleCourses();
    setCourses(sample);
    saveCourses(sample);
    if (sample.length > 0) {
      handleSelectCourse(sample[0].id);
    }
    alert('샘플 과정 3개(신임실무자 1·2기, 공공데이터 1기)가 성공적으로 적재되었습니다.');
  };

  // Export team data
  const handleExportTeamData = () => {
    if (courses.length === 0) {
      alert('내보낼 교육과정 데이터가 없습니다.');
      return;
    }
    exportTeamDataExcel(courses);
  };

  // Import team data
  const handleImportTeamData = async (file: File) => {
    try {
      const imported = await importTeamDataExcel(file);
      if (imported.length === 0) {
        alert('엑셀 파일에서 읽어올 수 있는 과정 정보가 없습니다.');
        return;
      }

      setCourses((prev) => {
        let merged = [...prev];
        let overwriteCount = 0;
        let newCount = 0;

        imported.forEach((newC) => {
          const dupIdx = merged.findIndex(
            (existing) => existing.title === newC.title && existing.generation === newC.generation
          );
          if (dupIdx !== -1) {
            // Found duplicate
            const doOverwrite = window.confirm(
              `[${newC.title} (${newC.generation}기)] 과정이 이미 등록되어 있습니다.\n새로 불러온 데이터로 덮어쓰시겠습니까?`
            );
            if (doOverwrite) {
              merged[dupIdx] = { ...newC, id: merged[dupIdx].id };
              overwriteCount++;
            }
          } else {
            merged.push(newC);
            newCount++;
          }
        });

        saveCourses(merged);
        alert(`팀 데이터 불러오기 완료!\n(신규 추가: ${newCount}건, 갱신: ${overwriteCount}건)`);
        if (merged.length > 0 && !activeCourseId) {
          handleSelectCourse(merged[0].id);
        }
        return merged;
      });
    } catch (err: any) {
      alert('팀 엑셀 데이터 불러오기 실패: ' + err.message);
    }
  };

  // Reset all
  const handleResetAll = () => {
    if (
      window.confirm(
        '경고: 브라우저에 저장된 모든 과정, 만족도 집계, 매핑 양식 데이터가 완전히 삭제됩니다.\n계속 진행하시겠습니까?'
      )
    ) {
      clearAllStorage();
      setCourses([]);
      setActiveCourseIdState(null);
      setCurrentTab('dashboard');
      alert('모든 데이터가 초기화되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      {/* Global Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        courses={courses}
        activeCourseId={activeCourseId}
        onSelectCourse={handleSelectCourse}
        onLoadSampleData={handleLoadSampleData}
        onExportTeamData={handleExportTeamData}
        onImportTeamData={handleImportTeamData}
        onResetAll={handleResetAll}
        aiAvailable={aiAvailable}
      />

      {/* Main Content Area */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            courses={courses}
            activeCourseId={activeCourseId}
            onSelectCourse={handleSelectCourse}
            onNavigateTab={setCurrentTab}
            onDeleteCourse={handleDeleteCourse}
            onLoadSample={handleLoadSampleData}
          />
        )}

        {currentTab === 'course-form' && (
          <CourseFormView
            courses={courses}
            activeCourseId={activeCourseId}
            onSaveCourse={handleSaveCourse}
            onDeleteCourse={handleDeleteCourse}
            onSelectCourse={handleSelectCourse}
          />
        )}

        {currentTab === 'upload' && (
          <DataUploadView
            courses={courses}
            activeCourseId={activeCourseId}
            templates={templates}
            onSaveTemplate={handleSaveTemplate}
            onUpdateCourseEvaluation={handleUpdateCourseEvaluation}
          />
        )}

        {currentTab === 'report' && (
          <ReportView
            courses={courses}
            activeCourseId={activeCourseId}
            aiAvailable={aiAvailable}
          />
        )}

        {currentTab === 'comparison' && (
          <ComparisonView courses={courses} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>공공기관 연수원 교육과정 평가·성과분석 보고서 도우미</span>
          <span>개인정보보호법 준수 · 로컬 브라우저 보안 처리</span>
        </div>
      </footer>
    </div>
  );
}
