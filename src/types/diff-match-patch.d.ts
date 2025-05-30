declare module 'diff-match-patch' {
  export class diff_match_patch {
    constructor();
    diff_main(text1: string, text2: string): Array<[number, string]>;
    diff_cleanupSemantic(diffs: Array<[number, string]>): void;
  }
} 