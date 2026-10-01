import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK if API key exists
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API: Check AI availability
app.get('/api/ai-status', (req, res) => {
  res.json({ available: !!ai });
});

// API: Summarize subjective opinions by theme
app.post('/api/gemini/summarize-opinions', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'AI 서비스가 활성화되지 않았습니다.' });
  }

  const { opinions, courseTitle } = req.body;
  if (!opinions || !Array.isArray(opinions) || opinions.length === 0) {
    return res.status(400).json({ error: '요약할 의견 목록이 비어 있습니다.' });
  }

  try {
    const prompt = `당신은 공공기관 연수원의 베테랑 교육평가 전문가입니다.
다음은 "${courseTitle || '교육과정'}" 수료생들이 작성한 주관식 설문 의견 목록입니다.
개인을 식별할 수 있는 정보(이름, 소속부서, 사번 등)는 철저히 배제하고, 공공기관 보고서 형식(개조식 문체, '~함', '~임')으로 주제별(예: 교육내용/커리큘럼, 교수/강사진, 운영/진행, 교육시설/환경)로 분류하고 긍정적 평가와 개선 요구사항을 핵심만 명료하게 요약해 주세요.

[주관식 의견 목록 (${opinions.length}건)]
${opinions.map((o: string, idx: number) => `${idx + 1}. ${o}`).join('\n')}

출력 형식:
## 1. 종합 평가 요약
(전체적인 만족도 경향 2~3줄 요약)

## 2. 주요 긍정 의견 (강점)
- **(영역명)**: 핵심 요약
- **(영역명)**: 핵심 요약

## 3. 주요 개선 요구 및 건의사항
- **(영역명)**: 건의사항 요약
- **(영역명)**: 건의사항 요약

## 4. 향후 차기 과정 반영 제언
- 구체적 개선 조치 2가지 제안`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '공공기관 연수원 결과보고서 스타일의 품격있고 정돈된 개조식 공문서 한국어로 작성하십시오.',
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Gemini summarize error:', error);
    res.status(500).json({ error: error.message || 'AI 요약 처리 중 오류가 발생했습니다.' });
  }
});

// API: Refine report text into official public document style
app.post('/api/gemini/refine-report', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'AI 서비스가 활성화되지 않았습니다.' });
  }

  const { text, context } = req.body;
  if (!text) {
    return res.status(400).json({ error: '다듬을 텍스트가 제공되지 않았습니다.' });
  }

  try {
    const prompt = `당신은 대한민국 공공기관의 기획보고서 전문 작성자입니다.
아래의 교육 결과보고서 문장을 행정안전부 공문서 작성 규칙 및 공공기관 표준 보고서 문체('~함', '~조치함', '~로 나타남', 명사형 종결 및 군더더기 없는 정밀한 표현)로 다듬어 주세요.
수치와 핵심 사실은 절대 왜곡하거나 누락하지 마세요.

[맥락]: ${context || '교육과정 결과보고서'}
[원문 문장]:
${text}

다듬어진 공문서 스타일 문장만 바로 사용할 수 있게 출력해 주세요. 부가 설명은 생략하세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '공문서 표준 어법과 격식을 갖춘 정갈한 한국어 보고서 문체로 작성합니다.',
      },
    });

    res.json({ result: response.text?.trim() });
  } catch (error: any) {
    console.error('Gemini refine error:', error);
    res.status(500).json({ error: error.message || 'AI 문장 윤문 처리 중 오류가 발생했습니다.' });
  }
});

// API: Suggest improvements based on evaluation statistics
app.post('/api/gemini/suggest-improvements', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'AI 서비스가 활성화되지 않았습니다.' });
  }

  const { statsSummary } = req.body;

  try {
    const prompt = `다음은 공공기관 교육과정의 만족도 및 성취도 통계 분석 결과입니다.
이를 면밀히 분석하여 차기 교육과정 개편 및 운영 개선을 위한 실무적이고 실현 가능한 개선 사항 3~4가지를 도출해 주세요.
공공기관 교육운영 결과보고서의 "개선 및 조치 계획" 섹션에 바로 삽입할 수 있는 개조식(~함, ~계획임) 형식으로 작성해 주십시오.

[교육 분석 데이터]:
${statsSummary}

출력 형식:
1. 교육 커리큘럼 및 교재 개선
- (구체적 실천 방안)
2. 교수학습 및 강사진 운영 개선
- (구체적 실천 방안)
3. 연수 환경 및 학습 인프라 개선
- (구체적 실천 방안)
4. 차기 기수 학습평가 및 사전수요 반영
- (구체적 실천 방안)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '공공기관 교육기획 실무자를 위한 현실적이고 신뢰도 높은 조치 계획을 제안하십시오.',
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Gemini improve error:', error);
    res.status(500).json({ error: error.message || '개선사항 제안 중 오류가 발생했습니다.' });
  }
});

// Setup Vite middleware or Static files
async function startServer() {
  // Create the HTTP server up front so Vite's HMR websocket can attach to
  // the same server/port instead of opening its own, which breaks behind
  // a reverse proxy that only forwards a single port.
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
