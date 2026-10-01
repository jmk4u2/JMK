export type OperationMode = '집합' | '원격' | '혼합';

export interface Course {
  id: string;
  title: string;              // 과정명
  generation: number;          // 기수 (예: 1, 2)
  startDate: string;          // 교육 시작일 (YYYY-MM-DD)
  endDate: string;            // 교육 종료일 (YYYY-MM-DD)
  targetAudience: string;     // 교육대상 (예: 5급 승진후보자, 공공기관 신임실무자 등)
  objectives: string;         // 교육목표
  operationMode: OperationMode; // 운영방식
  totalHours: number;         // 교육시간 (시간)
  targetCount: number;        // 교육인원 (명)
  completionCount: number;    // 수료인원 (명)
  completionRate: number;     // 수료율 (%)
  managerName: string;        // 담당자 이름/직급
  managerDepartment: string;  // 담당자 부서
  createdAt: string;
  updatedAt: string;

  // 연계 평가 데이터 ID 또는 내장
  evaluationData?: CourseEvaluation;
}

export type ColumnType = 'scale' | 'text' | 'personal_id' | 'ignore';

export interface ColumnMappingConfig {
  columnIndex: number;
  columnHeader: string;
  type: ColumnType;
  areaName?: string;          // 예: 교육내용, 강사평가, 교육운영, 교육환경
  scaleMax?: 5 | 7 | 10;      // 척도 (기본 5점)
}

export interface MappingTemplate {
  id: string;
  name: string;
  mappings: ColumnMappingConfig[];
  createdAt: string;
}

export interface ItemDistribution {
  [score: number]: number; // 점수별 빈도
}

export interface ItemResult {
  columnHeader: string;
  areaName: string;
  mean: number;               // 평균 (척도 기준)
  standardDeviation: number;  // 표준편차
  scaleMax: number;           // 최대 척도
  responseCount: number;      // 유효 응답 수
  distribution: ItemDistribution; // 1~N 빈도
  distributionPercent: { [score: number]: number }; // 백분율
  previousMean?: number;      // 전기 대비 평균 (비교용)
  diffPrevious?: number;      // 전기 대비 증감 (▲▼)
}

export interface AreaResult {
  areaName: string;
  mean: number;
  itemCount: number;
  previousMean?: number;
  diffPrevious?: number;
}

export interface PrePostStudentScore {
  id: string; // 익명화된 일련번호 (개인식별정보 배제)
  preScore: number;
  postScore: number;
  improvement: number;
}

export interface PrePostAnalysis {
  sampleCount: number;
  preMean: number;
  postMean: number;
  improvementMean: number;
  improvementRate: number; // ((사후-사전)/사전)*100
  preStdDev: number;
  postStdDev: number;
}

export interface CourseEvaluation {
  courseId: string;
  surveyRespondentCount: number; // 설문 응답자 수
  responseRate: number;          // 응답률 (%) = (설문응답자 / 수료인원) * 100
  overallMean: number;           // 전체 만족도 평균 (5점 환산)
  previousOverallMean?: number;  // 전기 전체 만족도
  diffPreviousOverall?: number;  // 전기 대비 증감
  scaleBase: number;             // 기준 척도 (5점)
  items: ItemResult[];           // 문항별 통계
  areas: AreaResult[];           // 영역별 통계
  subjectiveOpinions: string[];  // 주관식 의견 목록 (개인정보 제외)
  subjectiveSummary?: string;    // AI 또는 수동 요약
  prePostAnalysis?: PrePostAnalysis; // 사전-사후 성취도 분석 (선택)
  uploadedAt: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  type: 'overview' | 'operation' | 'evaluation' | 'achievement' | 'opinions' | 'improvements' | 'custom';
  enabled: boolean;
}

export interface ReportDraft {
  courseId: string;
  title: string;
  generatedDate: string;
  author: string;
  sections: ReportSection[];
}
