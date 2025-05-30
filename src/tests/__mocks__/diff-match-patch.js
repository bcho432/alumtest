class DiffMatchPatch {
  constructor() {
    this.diff_main = jest.fn((text1, text2) => {
      return [
        [0, text1],
        [1, text2],
      ];
    });
    this.diff_cleanupSemantic = jest.fn((diffs) => diffs);
    this.patch_make = jest.fn((text1, text2) => {
      return [
        {
          diffs: [
            [0, text1],
            [1, text2],
          ],
          start1: 0,
          start2: 0,
          length1: text1.length,
          length2: text2.length,
        },
      ];
    });
    this.patch_apply = jest.fn((patches, text) => {
      return [text, [true]];
    });
  }
}

module.exports = DiffMatchPatch; 