import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  convertInchesToTwip,
  ShadingType,
} from 'docx';
import { Course, ReportDraft } from '../types';

export async function generateWordDocument(course: Course, report: ReportDraft): Promise<void> {
  const FONT_NAME = '맑은 고딕';
  const PRIMARY_COLOR = '581C87'; // Royal Purple
  const HEADER_BG = 'F5F3FF'; // Soft Purple
  const BORDER_COLOR = 'CBD5E1';

  const defaultCellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  };

  // Section 1: Overview Table
  const overviewTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: '과정명 (기수)', bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            width: { size: 78, type: WidthType.PERCENTAGE },
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: `${course.title} (${course.generation}기)`, font: FONT_NAME })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: '교육기간', bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: `${course.startDate} ~ ${course.endDate} (총 ${course.totalHours}시간)`, font: FONT_NAME })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: '운영방식 / 교육대상', bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: `${course.operationMode} / ${course.targetAudience}`, font: FONT_NAME })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: '교육목표', bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: course.objectives || '-', font: FONT_NAME })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: '담당부서 / 담당자', bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: `${course.managerDepartment || '-'} ${course.managerName || ''}`, font: FONT_NAME })] })],
          }),
        ],
      }),
    ],
  });

  // Section 2: Operation Table
  const operationTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '계획 교육인원', bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '최종 수료인원', bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '수료율(%)', bold: true, font: FONT_NAME })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${course.targetCount}명`, font: FONT_NAME })] })],
          }),
          new TableCell({
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${course.completionCount}명`, font: FONT_NAME })] })],
          }),
          new TableCell({
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${course.completionRate}%`, bold: true, font: FONT_NAME })] })],
          }),
        ],
      }),
    ],
  });

  // Section 3: Evaluation Table
  const evaluationRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
          borders: defaultCellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '평가 영역', bold: true, font: FONT_NAME })] })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
          borders: defaultCellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '설문 평가 문항', bold: true, font: FONT_NAME })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
          borders: defaultCellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '평균 점수', bold: true, font: FONT_NAME })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
          borders: defaultCellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '표준편차', bold: true, font: FONT_NAME })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
          borders: defaultCellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '전기대비', bold: true, font: FONT_NAME })] })],
        }),
      ],
    }),
  ];

  if (course.evaluationData?.items && course.evaluationData.items.length > 0) {
    course.evaluationData.items.forEach((item) => {
      let diffStr = '-';
      if (item.diffPrevious !== undefined) {
        diffStr = item.diffPrevious > 0 ? `+${item.diffPrevious.toFixed(2)}` : `${item.diffPrevious.toFixed(2)}`;
      }
      evaluationRows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: defaultCellBorders,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.areaName, font: FONT_NAME })] })],
            }),
            new TableCell({
              borders: defaultCellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: item.columnHeader, font: FONT_NAME })] })],
            }),
            new TableCell({
              borders: defaultCellBorders,
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${item.mean.toFixed(2)}점`, bold: true, font: FONT_NAME })] })],
            }),
            new TableCell({
              borders: defaultCellBorders,
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.standardDeviation.toFixed(2), font: FONT_NAME })] })],
            }),
            new TableCell({
              borders: defaultCellBorders,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: diffStr, font: FONT_NAME })] })],
            }),
          ],
        })
      );
    });

    // Total row
    let overallDiffStr = '-';
    if (course.evaluationData.diffPreviousOverall !== undefined) {
      const d = course.evaluationData.diffPreviousOverall;
      overallDiffStr = d > 0 ? `+${d.toFixed(2)}` : `${d.toFixed(2)}`;
    }
    evaluationRows.push(
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '전체 종합', bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ children: [new TextRun({ text: `총 ${course.evaluationData.items.length}개 평가문항 평균`, bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${course.evaluationData.overallMean.toFixed(2)}점`, bold: true, font: FONT_NAME })] })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '-', font: FONT_NAME })] })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            borders: defaultCellBorders,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: overallDiffStr, bold: true, font: FONT_NAME })] })],
          }),
        ],
      })
    );
  }

  const evaluationTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: evaluationRows,
  });

  // Build document body paragraphs
  const docChildren: any[] = [];

  // Main Title
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: `[결과보고서] ${course.title} (${course.generation}기)`,
          size: 36, // 18pt
          bold: true,
          font: FONT_NAME,
          color: PRIMARY_COLOR,
        }),
      ],
    })
  );

  // Sub metadata
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `작성일: ${report.generatedDate} | 작성자: ${report.author}`,
          size: 20,
          font: FONT_NAME,
          color: '64748B',
        }),
      ],
    })
  );

  // Iterate sections
  report.sections.forEach((sec, index) => {
    if (!sec.enabled) return;

    // Heading
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 160 },
        children: [
          new TextRun({
            text: `${index + 1}. ${sec.title}`,
            size: 26,
            bold: true,
            font: FONT_NAME,
            color: PRIMARY_COLOR,
          }),
        ],
      })
    );

    // Section Content
    if (sec.content) {
      const lines = sec.content.split('\n');
      lines.forEach((line) => {
        if (line.trim().length > 0) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: line,
                  size: 22,
                  font: FONT_NAME,
                }),
              ],
            })
          );
        }
      });
    }

    // Embed tables depending on section type
    if (sec.type === 'overview') {
      docChildren.push(overviewTable);
    } else if (sec.type === 'operation') {
      docChildren.push(operationTable);
    } else if (sec.type === 'evaluation') {
      docChildren.push(evaluationTable);
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `[결과보고서]_${course.title}_${course.generation}기.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
