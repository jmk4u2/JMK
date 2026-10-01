import { Course, MappingTemplate } from '../types';

const STORAGE_KEY_COURSES = 'pub_training_courses_v1';
const STORAGE_KEY_TEMPLATES = 'pub_training_mapping_templates_v1';
const STORAGE_KEY_ACTIVE_COURSE = 'pub_training_active_course_id';

export function getStoredCourses(): Course[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COURSES);
    if (!raw) {
      const sample = getInitialSampleCourses();
      saveCourses(sample);
      return sample;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load courses from localStorage', e);
    return getInitialSampleCourses();
  }
}

export function saveCourses(courses: Course[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error('Failed to save courses to localStorage', e);
  }
}

export function getStoredTemplates(): MappingTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!raw) {
      const defaultTemplates: MappingTemplate[] = [
        {
          id: 'tpl_std_5pt',
          name: '연수원 표준 5점 만족도 서식 (내용·강사·운영·환경)',
          createdAt: new Date().toISOString(),
          mappings: [
            { columnIndex: 0, columnHeader: '순번', type: 'ignore' },
            { columnIndex: 1, columnHeader: '성명', type: 'personal_id' },
            { columnIndex: 2, columnHeader: '사번', type: 'personal_id' },
            { columnIndex: 3, columnHeader: '[내용] 교육과정 목표와 내용의 유익성', type: 'scale', areaName: '교육내용', scaleMax: 5 },
            { columnIndex: 4, columnHeader: '[내용] 실무 적용 가능성 및 현업 연계성', type: 'scale', areaName: '교육내용', scaleMax: 5 },
            { columnIndex: 5, columnHeader: '[강사] 강사의 전문성 및 강의 전달력', type: 'scale', areaName: '강사평가', scaleMax: 5 },
            { columnIndex: 6, columnHeader: '[강사] 질의응답 및 학습자 상호작용', type: 'scale', areaName: '강사평가', scaleMax: 5 },
            { columnIndex: 7, columnHeader: '[운영] 교육과정 운영 및 안내의 적절성', type: 'scale', areaName: '교육운영', scaleMax: 5 },
            { columnIndex: 8, columnHeader: '[환경] 강의실 시설 및 실습 기자재 만족도', type: 'scale', areaName: '교육환경', scaleMax: 5 },
            { columnIndex: 9, columnHeader: '주관식 종합의견 및 건의사항', type: 'text' },
          ],
        },
      ];
      saveTemplates(defaultTemplates);
      return defaultTemplates;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load templates', e);
    return [];
  }
}

export function saveTemplates(templates: MappingTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates', e);
  }
}

export function getActiveCourseId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_COURSE);
}

export function setActiveCourseId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_COURSE, id);
}

export function clearAllStorage(): void {
  localStorage.removeItem(STORAGE_KEY_COURSES);
  localStorage.removeItem(STORAGE_KEY_TEMPLATES);
  localStorage.removeItem(STORAGE_KEY_ACTIVE_COURSE);
}

// 3 Realistic Sample Courses
export function getInitialSampleCourses(): Course[] {
  return [
    {
      id: 'course-sample-01',
      title: '2026년 공공기관 신임실무자 역량강화과정',
      generation: 1,
      startDate: '2026-03-09',
      endDate: '2026-03-13',
      targetAudience: '공공기관 신규 임용자 및 실무자 (재직 1년 미만)',
      objectives: '공직 가치 확립, 기획보고서 작성 실무 및 공공 갈등관리 역량 제고',
      operationMode: '집합',
      totalHours: 35,
      targetCount: 32,
      completionCount: 30,
      completionRate: 93.8,
      managerName: '김진호 주임',
      managerDepartment: '인재개발원 교육기획부',
      createdAt: '2026-03-14T09:00:00Z',
      updatedAt: '2026-03-14T10:30:00Z',
      evaluationData: {
        courseId: 'course-sample-01',
        surveyRespondentCount: 30,
        responseRate: 100.0,
        overallMean: 4.45,
        scaleBase: 5,
        items: [
          {
            columnHeader: '교육과정 목표와 내용의 유익성',
            areaName: '교육내용',
            mean: 4.53,
            standardDeviation: 0.51,
            scaleMax: 5,
            responseCount: 30,
            distribution: { 5: 16, 4: 14, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 53.3, 4: 46.7, 3: 0, 2: 0, 1: 0 },
          },
          {
            columnHeader: '실무 적용 가능성 및 현업 연계성',
            areaName: '교육내용',
            mean: 4.40,
            standardDeviation: 0.56,
            scaleMax: 5,
            responseCount: 30,
            distribution: { 5: 13, 4: 16, 3: 1, 2: 0, 1: 0 },
            distributionPercent: { 5: 43.3, 4: 53.3, 3: 3.3, 2: 0, 1: 0 },
          },
          {
            columnHeader: '강사의 전문성 및 강의 전달력',
            areaName: '강사평가',
            mean: 4.67,
            standardDeviation: 0.48,
            scaleMax: 5,
            responseCount: 30,
            distribution: { 5: 20, 4: 10, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 66.7, 4: 33.3, 3: 0, 2: 0, 1: 0 },
          },
          {
            columnHeader: '질의응답 및 학습자 상호작용',
            areaName: '강사평가',
            mean: 4.50,
            standardDeviation: 0.57,
            scaleMax: 5,
            responseCount: 30,
            distribution: { 5: 16, 4: 13, 3: 1, 2: 0, 1: 0 },
            distributionPercent: { 5: 53.3, 4: 43.3, 3: 3.3, 2: 0, 1: 0 },
          },
          {
            columnHeader: '교육과정 운영 및 안내의 적절성',
            areaName: '교육운영',
            mean: 4.43,
            standardDeviation: 0.57,
            scaleMax: 5,
            responseCount: 30,
            distribution: { 5: 14, 4: 15, 3: 1, 2: 0, 1: 0 },
            distributionPercent: { 5: 46.7, 4: 50.0, 3: 3.3, 2: 0, 1: 0 },
          },
          {
            columnHeader: '강의실 시설 및 실습 기자재 만족도',
            areaName: '교육환경',
            mean: 4.17,
            standardDeviation: 0.65,
            scaleMax: 5,
            responseCount: 30,
            distribution: { 5: 9, 4: 17, 3: 4, 2: 0, 1: 0 },
            distributionPercent: { 5: 30.0, 4: 56.7, 3: 13.3, 2: 0, 1: 0 },
          },
        ],
        areas: [
          { areaName: '교육내용', mean: 4.47, itemCount: 2 },
          { areaName: '강사평가', mean: 4.59, itemCount: 2 },
          { areaName: '교육운영', mean: 4.43, itemCount: 1 },
          { areaName: '교육환경', mean: 4.17, itemCount: 1 },
        ],
        subjectiveOpinions: [
          '실무 보고서 작성 실습 피드백이 직무 복귀 후 즉시 도움이 될 것 같습니다.',
          '강사님의 열정적인 현장 실무 사례 공유가 매우 유익했습니다.',
          '분임 토의 시간이 다소 촉박하여 실습 시간을 1~2시간 확대하면 좋겠습니다.',
          '강의실 와이파이 연결 상태가 불안정하여 실습 중 불편함이 있었습니다.',
          '기획재정부 및 공공기관 실무 가이드라인 교재 퀄리티가 우수했습니다.',
          '동기들과의 네트워킹 시간이 더 마련되었으면 합니다.',
        ],
        subjectiveSummary: '실무 보고서 작성 및 직무 피드백에 대해 95% 이상의 높은 만족도를 보였으나, 실습 분임토의 시간 부족 및 전산 실습실 네트워크 접속 불안정에 대한 환경 개선 요구가 제기됨.',
        prePostAnalysis: {
          sampleCount: 30,
          preMean: 62.5,
          postMean: 86.8,
          improvementMean: 24.3,
          improvementRate: 38.9,
          preStdDev: 8.4,
          postStdDev: 6.2,
        },
        uploadedAt: '2026-03-14T10:15:00Z',
      },
    },
    {
      id: 'course-sample-02',
      title: '2026년 공공기관 신임실무자 역량강화과정',
      generation: 2,
      startDate: '2026-04-13',
      endDate: '2026-04-17',
      targetAudience: '공공기관 신규 임용자 및 실무자 (재직 1년 미만)',
      objectives: '공직 가치 확립, 기획보고서 작성 실무 및 공공 갈등관리 역량 제고',
      operationMode: '집합',
      totalHours: 35,
      targetCount: 34,
      completionCount: 33,
      completionRate: 97.1,
      managerName: '김진호 주임',
      managerDepartment: '인재개발원 교육기획부',
      createdAt: '2026-04-18T09:00:00Z',
      updatedAt: '2026-04-18T11:00:00Z',
      evaluationData: {
        courseId: 'course-sample-02',
        surveyRespondentCount: 33,
        responseRate: 100.0,
        overallMean: 4.62,
        previousOverallMean: 4.45,
        diffPreviousOverall: 0.17,
        scaleBase: 5,
        items: [
          {
            columnHeader: '교육과정 목표와 내용의 유익성',
            areaName: '교육내용',
            mean: 4.67,
            standardDeviation: 0.48,
            scaleMax: 5,
            responseCount: 33,
            distribution: { 5: 22, 4: 11, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 66.7, 4: 33.3, 3: 0, 2: 0, 1: 0 },
            previousMean: 4.53,
            diffPrevious: 0.14,
          },
          {
            columnHeader: '실무 적용 가능성 및 현업 연계성',
            areaName: '교육내용',
            mean: 4.58,
            standardDeviation: 0.50,
            scaleMax: 5,
            responseCount: 33,
            distribution: { 5: 19, 4: 14, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 57.6, 4: 42.4, 3: 0, 2: 0, 1: 0 },
            previousMean: 4.40,
            diffPrevious: 0.18,
          },
          {
            columnHeader: '강사의 전문성 및 강의 전달력',
            areaName: '강사평가',
            mean: 4.76,
            standardDeviation: 0.44,
            scaleMax: 5,
            responseCount: 33,
            distribution: { 5: 25, 4: 8, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 75.8, 4: 24.2, 3: 0, 2: 0, 1: 0 },
            previousMean: 4.67,
            diffPrevious: 0.09,
          },
          {
            columnHeader: '질의응답 및 학습자 상호작용',
            areaName: '강사평가',
            mean: 4.64,
            standardDeviation: 0.49,
            scaleMax: 5,
            responseCount: 33,
            distribution: { 5: 21, 4: 12, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 63.6, 4: 36.4, 3: 0, 2: 0, 1: 0 },
            previousMean: 4.50,
            diffPrevious: 0.14,
          },
          {
            columnHeader: '교육과정 운영 및 안내의 적절성',
            areaName: '교육운영',
            mean: 4.61,
            standardDeviation: 0.50,
            scaleMax: 5,
            responseCount: 33,
            distribution: { 5: 20, 4: 13, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 60.6, 4: 39.4, 3: 0, 2: 0, 1: 0 },
            previousMean: 4.43,
            diffPrevious: 0.18,
          },
          {
            columnHeader: '강의실 시설 및 실습 기자재 만족도',
            areaName: '교육환경',
            mean: 4.48,
            standardDeviation: 0.51,
            scaleMax: 5,
            responseCount: 33,
            distribution: { 5: 16, 4: 17, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 48.5, 4: 51.5, 3: 0, 2: 0, 1: 0 },
            previousMean: 4.17,
            diffPrevious: 0.31,
          },
        ],
        areas: [
          { areaName: '교육내용', mean: 4.63, itemCount: 2, previousMean: 4.47, diffPrevious: 0.16 },
          { areaName: '강사평가', mean: 4.70, itemCount: 2, previousMean: 4.59, diffPrevious: 0.11 },
          { areaName: '교육운영', mean: 4.61, itemCount: 1, previousMean: 4.43, diffPrevious: 0.18 },
          { areaName: '교육환경', mean: 4.48, itemCount: 1, previousMean: 4.17, diffPrevious: 0.31 },
        ],
        subjectiveOpinions: [
          '1기 피드백을 반영해 분임 실습 시간이 2시간 늘어나서 보고서를 완성도 높게 작성할 수 있었습니다.',
          '강의실 와이파이와 전산 장비가 교체되어 실습 환경이 매우 쾌적했습니다.',
          '공문서 기획 강사님의 1:1 맞춤 첨삭이 큰 도움이 되었습니다.',
          '향후 심화과정(공공 갈등관리 실무)도 개설되면 꼭 수강하고 싶습니다.',
        ],
        subjectiveSummary: '1기 개선요구사항(분임실습 시간 확대, 전산실 인프라 정비)이 적절히 반영되어 교육환경 만족도가 +0.31점 대폭 상승하였으며 전반적인 교육 만족도가 우수함.',
        prePostAnalysis: {
          sampleCount: 33,
          preMean: 64.0,
          postMean: 91.2,
          improvementMean: 27.2,
          improvementRate: 42.5,
          preStdDev: 7.9,
          postStdDev: 5.1,
        },
        uploadedAt: '2026-04-18T10:45:00Z',
      },
    },
    {
      id: 'course-sample-03',
      title: '공공데이터 분석 및 실무 활용과정',
      generation: 1,
      startDate: '2026-05-18',
      endDate: '2026-05-22',
      targetAudience: '공공기관 및 공기업 데이터·전산·기획 실무자',
      objectives: '파이썬 기반 공공데이터 수집·정제 및 시각화 대시보드 제작 실무',
      operationMode: '혼합',
      totalHours: 30,
      targetCount: 26,
      completionCount: 25,
      completionRate: 96.2,
      managerName: '이수민 대리',
      managerDepartment: '디지털혁신인재팀',
      createdAt: '2026-05-23T09:00:00Z',
      updatedAt: '2026-05-23T11:00:00Z',
      evaluationData: {
        courseId: 'course-sample-03',
        surveyRespondentCount: 25,
        responseRate: 100.0,
        overallMean: 4.54,
        scaleBase: 5,
        items: [
          {
            columnHeader: '공공데이터 분석 기법의 업무 유용성',
            areaName: '교육내용',
            mean: 4.60,
            standardDeviation: 0.50,
            scaleMax: 5,
            responseCount: 25,
            distribution: { 5: 15, 4: 10, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 60.0, 4: 40.0, 3: 0, 2: 0, 1: 0 },
          },
          {
            columnHeader: '실습 프로젝트의 적절성 및 난이도',
            areaName: '교육내용',
            mean: 4.40,
            standardDeviation: 0.58,
            scaleMax: 5,
            responseCount: 25,
            distribution: { 5: 11, 4: 13, 3: 1, 2: 0, 1: 0 },
            distributionPercent: { 5: 44.0, 4: 52.0, 3: 4.0, 2: 0, 1: 0 },
          },
          {
            columnHeader: '강사의 실습 지도 및 코드 피드백',
            areaName: '강사평가',
            mean: 4.72,
            standardDeviation: 0.46,
            scaleMax: 5,
            responseCount: 25,
            distribution: { 5: 18, 4: 7, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 72.0, 4: 28.0, 3: 0, 2: 0, 1: 0 },
          },
          {
            columnHeader: '온·오프라인 혼합 플랫폼 운영 원활성',
            areaName: '교육운영',
            mean: 4.48,
            standardDeviation: 0.51,
            scaleMax: 5,
            responseCount: 25,
            distribution: { 5: 12, 4: 13, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 48.0, 4: 52.0, 3: 0, 2: 0, 1: 0 },
          },
          {
            columnHeader: '실습 서버 및 가상환경 안정성',
            areaName: '교육환경',
            mean: 4.52,
            standardDeviation: 0.51,
            scaleMax: 5,
            responseCount: 25,
            distribution: { 5: 13, 4: 12, 3: 0, 2: 0, 1: 0 },
            distributionPercent: { 5: 52.0, 4: 48.0, 3: 0, 2: 0, 1: 0 },
          },
        ],
        areas: [
          { areaName: '교육내용', mean: 4.50, itemCount: 2 },
          { areaName: '강사평가', mean: 4.72, itemCount: 1 },
          { areaName: '교육운영', mean: 4.48, itemCount: 1 },
          { areaName: '교육환경', mean: 4.52, itemCount: 1 },
        ],
        subjectiveOpinions: [
          '비전공자도 따라올 수 있게 실습 가이드라인이 친절하여 큰 허들 없이 수료했습니다.',
          '실제 공공포털 오픈API를 연동해 시각화 차트를 구축해본 경험이 매우 유익했습니다.',
          '사전 이러닝과 집합 실습의 연계가 매끄러웠습니다.',
        ],
        subjectiveSummary: '혼합형(Blended Learning) 운영의 안정성과 강사의 1:1 실습 코칭에 대한 만족도가 높았으며, 비전공자 대상 실습 난이도 조정에 긍정적 평가.',
        prePostAnalysis: {
          sampleCount: 25,
          preMean: 54.0,
          postMean: 88.5,
          improvementMean: 34.5,
          improvementRate: 63.9,
          preStdDev: 11.2,
          postStdDev: 6.8,
        },
        uploadedAt: '2026-05-23T10:20:00Z',
      },
    },
  ];
}
