import { ItemResult, AreaResult, PrePostAnalysis } from '../types';

export function calculateMean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Number((sum / numbers.length).toFixed(2));
}

export function calculateStdDev(numbers: number[], mean?: number): number {
  if (numbers.length <= 1) return 0;
  const m = mean !== undefined ? mean : calculateMean(numbers);
  const variance = numbers.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / (numbers.length - 1);
  return Number(Math.sqrt(variance).toFixed(2));
}

export function generateOfficialSummarySentence(
  overallMean: number,
  scaleMax: number,
  diffPrevious?: number,
  areas?: AreaResult[]
): string {
  let sentence = `전체 만족도는 ${overallMean.toFixed(2)}점(${scaleMax}점 만점 기준)으로 집계되었으며, `;

  if (diffPrevious !== undefined) {
    if (diffPrevious > 0) {
      sentence += `전기 과정 대비 ${diffPrevious.toFixed(2)}점 상승(▲)하여 교육생 만족도가 전반적으로 향상된 것으로 나타남. `;
    } else if (diffPrevious < 0) {
      sentence += `전기 과정 대비 ${Math.abs(diffPrevious).toFixed(2)}점 소폭 하락(▼)하여 차기 교육 시 환류 및 보완이 요구됨. `;
    } else {
      sentence += `전기 과정과 동일한 수준의 만족도를 유지함. `;
    }
  }

  if (areas && areas.length > 0) {
    const sortedAreas = [...areas].sort((a, b) => b.mean - a.mean);
    const highest = sortedAreas[0];
    const lowest = sortedAreas[sortedAreas.length - 1];

    if (sortedAreas.length === 1) {
      sentence += `영역별로는 [${highest.areaName}] 영역이 ${highest.mean.toFixed(2)}점을 기록함.`;
    } else {
      sentence += `영역별 분석 결과, [${highest.areaName}] 영역(${highest.mean.toFixed(2)}점)이 가장 높은 긍정적 평가를 받았으며, [${lowest.areaName}] 영역(${lowest.mean.toFixed(2)}점)은 상대적으로 낮게 나타나 우선 개선 대상 영역으로 도출됨.`;
    }
  }

  return sentence;
}

export function generateAchievementSentence(prePost: PrePostAnalysis): string {
  const pre = prePost.preMean.toFixed(2);
  const post = prePost.postMean.toFixed(2);
  const diff = prePost.improvementMean.toFixed(2);
  const rate = prePost.improvementRate.toFixed(1);

  return `학업성취도 사전·사후 평가 분석 결과, 사전 평균 ${pre}점에서 사후 평균 ${post}점으로 ${diff}점 향상(${rate}% 증가)되어 본 교육과정을 통한 직무역량 및 학습목표 도달도가 실질적으로 증진된 것으로 확인됨.`;
}
