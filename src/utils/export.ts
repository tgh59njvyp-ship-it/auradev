import JSZip from 'jszip';
import { Project } from '../types';

export async function exportProjectAsZip(project: Project): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(project.name.replace(/[^a-zA-Z0-9_\-]/g, '_')) || zip;

  for (const file of project.files) {
    folder.file(file.path, file.content);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export interface LineDiff {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  lineNumberOld?: number;
  lineNumberNew?: number;
}

/**
 * Line-by-line diff computation for visual Diff Viewer
 */
export function computeLineDiff(original: string, proposed: string): LineDiff[] {
  const origLines = original.split('\n');
  const propLines = proposed.split('\n');
  const result: LineDiff[] = [];

  let o = 0;
  let p = 0;

  while (o < origLines.length || p < propLines.length) {
    if (o < origLines.length && p < propLines.length) {
      if (origLines[o] === propLines[p]) {
        result.push({
          type: 'unchanged',
          content: origLines[o],
          lineNumberOld: o + 1,
          lineNumberNew: p + 1
        });
        o++;
        p++;
      } else {
        // Look ahead to check if line was replaced, deleted, or inserted
        const nextOrigInProp = propLines.indexOf(origLines[o], p);
        const nextPropInOrig = origLines.indexOf(propLines[p], o);

        if (nextOrigInProp !== -1 && (nextPropInOrig === -1 || nextOrigInProp - p < nextPropInOrig - o)) {
          // Line added
          result.push({
            type: 'added',
            content: propLines[p],
            lineNumberNew: p + 1
          });
          p++;
        } else if (nextPropInOrig !== -1) {
          // Line removed
          result.push({
            type: 'removed',
            content: origLines[o],
            lineNumberOld: o + 1
          });
          o++;
        } else {
          // Changed line
          result.push({
            type: 'removed',
            content: origLines[o],
            lineNumberOld: o + 1
          });
          result.push({
            type: 'added',
            content: propLines[p],
            lineNumberNew: p + 1
          });
          o++;
          p++;
        }
      }
    } else if (o < origLines.length) {
      result.push({
        type: 'removed',
        content: origLines[o],
        lineNumberOld: o + 1
      });
      o++;
    } else if (p < propLines.length) {
      result.push({
        type: 'added',
        content: propLines[p],
        lineNumberNew: p + 1
      });
      p++;
    }
  }

  return result;
}
