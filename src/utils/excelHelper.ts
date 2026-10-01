import * as XLSX from 'xlsx';
import { Course, CourseEvaluation, ItemResult, AreaResult, PrePostAnalysis } from '../types';

// Convert worksheet to 2D array of rows
export function readExcelFile(file: File): Promise<{ sheetNames: string[]; data: any[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
        resolve({
          sheetNames: workbook.SheetNames,
          data: data as any[][],
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Download sample survey Excel
export function downloadSampleSurveyExcel() {
  const headers = [
    '순번',
    '성명(개인식별-제외)',
    '사번(개인식별-제외)',
    '[내용] 교육과정 목표와 내용의 유익성',
    '[내용] 실무 적용 가능성 및 현업 연계성',
    '[강사] 강사의 전문성 및 강의 전달력',
    '[강사] 질의응답 및 학습자 상호작용',
    '[운영] 교육과정 운영 및 안내의 적절성',
    '[환경] 강의실 시설 및 실습 기자재 만족도',
    '주관식 종합의견 및 건의사항',
  ];

  const rows = [
    [1, '홍길동', 'A1001', 5, 5, 5, 4, 5, 4, '실무에 바로 활용할 수 있는 알찬 교육이었습니다.'],
    [2, '김철수', 'A1002', 4, 4, 5, 5, 4, 4, '강사님의 구체적인 사례 중심 강의가 매우 인상 깊었습니다.'],
    [3, '이영희', 'A1003', 5, 4, 5, 5, 5, 3, '강의실 냉방이 다소 강해 온도 조절이 필요했습니다.'],
    [4, '박민수', 'A1004', 4, 5, 4, 4, 4, 4, '교재와 실습 자료가 잘 구비되어 있어 이해하기 수월했습니다.'],
    [5, '최수진', 'A1005', 5, 5, 5, 5, 4, 5, '다음 기수에도 동료들에게 적극 추천하고 싶습니다.'],
    [6, '정재훈', 'A1006', 4, 4, 4, 4, 5, 4, '토의 시간이 좀 더 넉넉했으면 좋겠습니다.'],
    [7, '강다은', 'A1007', 5, 4, 5, 5, 4, 3, '주차 공간 및 편의시설 안내가 사전에 제공되면 좋겠습니다.'],
    [8, '조현우', 'A1008', 4, 5, 5, 4, 5, 4, '강사님의 열정적인 피드백 덕분에 많은 도움을 받았습니다.'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '만족도설문응답');
  XLSX.writeFile(wb, '표준_만족도설문_샘플양식.xlsx');
}

// Download sample pre/post assessment Excel
export function downloadSamplePrePostExcel() {
  const headers = ['일련번호', '사전평가점수(100점만점)', '사후평가점수(100점만점)'];
  const rows = [
    ['001', 65, 88],
    ['002', 70, 92],
    ['003', 55, 85],
    ['004', 60, 90],
    ['005', 75, 95],
    ['006', 50, 80],
    ['007', 68, 89],
    ['008', 72, 94],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '성취도평가');
  XLSX.writeFile(wb, '표준_학업성취도_사전사후_샘플양식.xlsx');
}

// Export team data to a comprehensive Excel workbook (5 sheets)
export function exportTeamDataExcel(courses: Course[]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Course Information
  const courseHeaders = [
    '과정ID',
    '과정명',
    '기수',
    '시작일',
    '종료일',
    '운영방식',
    '교육시간(H)',
    '교육대상',
    '교육목표',
    '교육인원(명)',
    '수료인원(명)',
    '수료율(%)',
    '담당자',
    '담당부서',
    '설문응답자(명)',
    '응답률(%)',
    '전체만족도(5점기준)',
  ];

  const courseRows = courses.map((c) => [
    c.id,
    c.title,
    c.generation,
    c.startDate,
    c.endDate,
    c.operationMode,
    c.totalHours,
    c.targetAudience,
    c.objectives,
    c.targetCount,
    c.completionCount,
    c.completionRate,
    c.managerName,
    c.managerDepartment,
    c.evaluationData?.surveyRespondentCount || 0,
    c.evaluationData?.responseRate || 0,
    c.evaluationData?.overallMean || 0,
  ]);

  const wsCourse = XLSX.utils.aoa_to_sheet([courseHeaders, ...courseRows]);
  XLSX.utils.book_append_sheet(wb, wsCourse, '과정정보');

  // Sheet 2: Item Results
  const itemHeaders = [
    '과정ID',
    '과정명',
    '기수',
    '영역명',
    '문항내용',
    '평균점수',
    '표준편차',
    '척도',
    '응답수',
    '1점비율(%)',
    '2점비율(%)',
    '3점비율(%)',
    '4점비율(%)',
    '5점비율(%)',
  ];
  const itemRows: any[] = [];
  courses.forEach((c) => {
    c.evaluationData?.items.forEach((item) => {
      itemRows.push([
        c.id,
        c.title,
        c.generation,
        item.areaName,
        item.columnHeader,
        item.mean,
        item.standardDeviation,
        item.scaleMax,
        item.responseCount,
        item.distributionPercent[1] || 0,
        item.distributionPercent[2] || 0,
        item.distributionPercent[3] || 0,
        item.distributionPercent[4] || 0,
        item.distributionPercent[5] || 0,
      ]);
    });
  });
  const wsItems = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
  XLSX.utils.book_append_sheet(wb, wsItems, '문항별결과');

  // Sheet 3: Area Results
  const areaHeaders = ['과정ID', '과정명', '기수', '영역명', '영역평균점수', '문항수'];
  const areaRows: any[] = [];
  courses.forEach((c) => {
    c.evaluationData?.areas.forEach((area) => {
      areaRows.push([c.id, c.title, c.generation, area.areaName, area.mean, area.itemCount]);
    });
  });
  const wsAreas = XLSX.utils.aoa_to_sheet([areaHeaders, ...areaRows]);
  XLSX.utils.book_append_sheet(wb, wsAreas, '영역별결과');

  // Sheet 4: Achievement Results (Pre/Post)
  const achHeaders = [
    '과정ID',
    '과정명',
    '기수',
    '평가인원(명)',
    '사전평균',
    '사후평균',
    '향상점수',
    '향상률(%)',
  ];
  const achRows: any[] = [];
  courses.forEach((c) => {
    if (c.evaluationData?.prePostAnalysis) {
      const p = c.evaluationData.prePostAnalysis;
      achRows.push([
        c.id,
        c.title,
        c.generation,
        p.sampleCount,
        p.preMean,
        p.postMean,
        p.improvementMean,
        p.improvementRate,
      ]);
    }
  });
  const wsAch = XLSX.utils.aoa_to_sheet([achHeaders, ...achRows]);
  XLSX.utils.book_append_sheet(wb, wsAch, '성취도결과');

  // Sheet 5: Subjective Opinions (Personal info excluded)
  const opHeaders = ['과정명', '기수', '연번', '의견내용(개인정보제외)'];
  const opRows: any[] = [];
  courses.forEach((c) => {
    c.evaluationData?.subjectiveOpinions.forEach((op, idx) => {
      opRows.push([c.title, c.generation, idx + 1, op]);
    });
  });
  const wsOp = XLSX.utils.aoa_to_sheet([opHeaders, ...opRows]);
  XLSX.utils.book_append_sheet(wb, wsOp, '주관식의견');

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `교육과정_평가성과_팀데이터_${todayStr}.xlsx`);
}

// Import team data from Excel
export function importTeamDataExcel(file: File): Promise<Course[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });

        if (!wb.Sheets['과정정보']) {
          throw new Error('올바른 팀 데이터 엑셀 파일이 아닙니다. ("과정정보" 시트 누락)');
        }

        const courseSheet = wb.Sheets['과정정보'];
        const courseJson: any[] = XLSX.utils.sheet_to_json(courseSheet);

        const itemJson: any[] = wb.Sheets['문항별결과'] ? XLSX.utils.sheet_to_json(wb.Sheets['문항별결과']) : [];
        const areaJson: any[] = wb.Sheets['영역별결과'] ? XLSX.utils.sheet_to_json(wb.Sheets['영역별결과']) : [];
        const achJson: any[] = wb.Sheets['성취도결과'] ? XLSX.utils.sheet_to_json(wb.Sheets['성취도결과']) : [];
        const opJson: any[] = wb.Sheets['주관식의견'] ? XLSX.utils.sheet_to_json(wb.Sheets['주관식의견']) : [];

        const importedCourses: Course[] = courseJson.map((row) => {
          const id = String(row['과정ID'] || 'c_' + Math.random().toString(36).slice(2, 9));
          const title = String(row['과정명'] || '미지정 과정');
          const gen = Number(row['기수'] || 1);

          // Find items
          const items: ItemResult[] = itemJson
            .filter((r) => String(r['과정ID']) === id || (r['과정명'] === title && Number(r['기수']) === gen))
            .map((r) => ({
              columnHeader: String(r['문항내용'] || ''),
              areaName: String(r['영역명'] || '기타'),
              mean: Number(r['평균점수'] || 0),
              standardDeviation: Number(r['표준편차'] || 0),
              scaleMax: Number(r['척도'] || 5),
              responseCount: Number(r['응답수'] || 0),
              distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              distributionPercent: {
                1: Number(r['1점비율(%)'] || 0),
                2: Number(r['2점비율(%)'] || 0),
                3: Number(r['3점비율(%)'] || 0),
                4: Number(r['4점비율(%)'] || 0),
                5: Number(r['5점비율(%)'] || 0),
              },
            }));

          // Find areas
          const areas: AreaResult[] = areaJson
            .filter((r) => String(r['과정ID']) === id || (r['과정명'] === title && Number(r['기수']) === gen))
            .map((r) => ({
              areaName: String(r['영역명'] || '기타'),
              mean: Number(r['영역평균점수'] || 0),
              itemCount: Number(r['문항수'] || 1),
            }));

          // Find achievement
          const achRow = achJson.find((r) => String(r['과정ID']) === id || (r['과정명'] === title && Number(r['기수']) === gen));
          let prePostAnalysis: PrePostAnalysis | undefined = undefined;
          if (achRow) {
            prePostAnalysis = {
              sampleCount: Number(achRow['평가인원(명)'] || 0),
              preMean: Number(achRow['사전평균'] || 0),
              postMean: Number(achRow['사후평균'] || 0),
              improvementMean: Number(achRow['향상점수'] || 0),
              improvementRate: Number(achRow['향상률(%)'] || 0),
              preStdDev: 0,
              postStdDev: 0,
            };
          }

          // Find opinions
          const opinions = opJson
            .filter((r) => r['과정명'] === title && Number(r['기수']) === gen)
            .map((r) => String(r['의견내용(개인정보제외)'] || ''))
            .filter((t) => t.trim().length > 0);

          let evaluationData: CourseEvaluation | undefined = undefined;
          if (items.length > 0 || areas.length > 0 || opinions.length > 0) {
            evaluationData = {
              courseId: id,
              surveyRespondentCount: Number(row['설문응답자(명)'] || 0),
              responseRate: Number(row['응답률(%)'] || 0),
              overallMean: Number(row['전체만족도(5점기준)'] || 0),
              scaleBase: 5,
              items,
              areas,
              subjectiveOpinions: opinions,
              prePostAnalysis,
              uploadedAt: new Date().toISOString(),
            };
          }

          const targetCount = Number(row['교육인원(명)'] || 0);
          const completionCount = Number(row['수료인원(명)'] || 0);
          const completionRate = targetCount > 0 ? Number(((completionCount / targetCount) * 100).toFixed(1)) : 0;

          return {
            id,
            title,
            generation: gen,
            startDate: String(row['시작일'] || ''),
            endDate: String(row['종료일'] || ''),
            operationMode: (row['운영방식'] || '집합') as any,
            totalHours: Number(row['교육시간(H)'] || 0),
            targetAudience: String(row['교육대상'] || ''),
            objectives: String(row['교육목표'] || ''),
            targetCount,
            completionCount,
            completionRate,
            managerName: String(row['담당자'] || ''),
            managerDepartment: String(row['담당부서'] || ''),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            evaluationData,
          };
        });

        resolve(importedCourses);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
