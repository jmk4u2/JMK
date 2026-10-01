/**
 * Copies an HTML snippet to the system clipboard as 'text/html' and 'text/plain'.
 * This ensures that when pasted into Hancom Office (HWP/아래아한글) or Word,
 * table structures, cell borders, and styling remain fully preserved.
 */
export async function copyHtmlTableToClipboard(htmlString: string, plainTextFallback: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
table { border-collapse: collapse; width: 100%; font-family: '맑은 고딕', sans-serif; font-size: 10pt; }
th, td { border: 1px solid #7f8c8d; padding: 6px 10px; text-align: left; }
th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
.text-center { text-align: center; }
.text-right { text-align: right; }
</style>
</head>
<body>
${htmlString}
</body>
</html>`;

      const blobHtml = new Blob([fullHtml], { type: 'text/html' });
      const blobText = new Blob([plainTextFallback], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = plainTextFallback;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
