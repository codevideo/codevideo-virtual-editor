import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";
import { IAction } from "@fullstackcraftllc/codevideo-types";

describe("VirtualEditor", () => {
  describe("Highlight Examples", () => {
    it("handles backwards highlight with delete works as expect", () => {
      // arrange
      const virtualEditor = new VirtualEditor([]);
      const highlightExampleActions: IAction[] = [
        // 1 because 0 is initialization within VirtualEditor
        {
          name: "type-editor",
          value:
            "abcdef",
        },
        // 2
        {
          name: "shift+arrow-left",
          value:
            "3",
        },
        // 3
        {
          name: "backspace",
          value: "1",
        },
        // 4
        {
          name: "type-editor",
          value:
            "123",
        }
      ];

      // act
      virtualEditor.applyActions(highlightExampleActions);

      // assert - initial highlight should be -1, -1
      expect(virtualEditor.getHighlightedCodeAtActionIndex(0)).toEqual("");
      // expect(virtualEditor.getHighlightedCodeAtActionIndex(1)).toEqual("");
      // assert - highlighted code after 2nd action should be 'def'
      expect(virtualEditor.getHighlightedCodeAtActionIndex(2)).toEqual("def");
      // assert - code after 3rd action should be 'abc123'
      expect(virtualEditor.getCodeAtActionIndex(4)).toEqual("abc123");
      expect(virtualEditor.getHighlightedCodeAtActionIndex(4)).toEqual("");
    })

    it("handles backwards highlight with enter works as expect", () => {
      // arrange
      const virtualEditor = new VirtualEditor([]);
      const highlightExampleActions: IAction[] = [
        // 1 - because 0 is initialization within VirtualEditor
        {
          name: "type-editor",
          value:
            "abcdef",
        },
        // 2
        {
          name: "shift+arrow-left",
          value:
            "3",
        },
        // 3
        {
          name: "enter",
          value: "1",
        },
        // 4
        {
          name: "type-editor",
          value:
            "123",
        }
      ];

      // act
      virtualEditor.applyActions(highlightExampleActions);

      // assert - initial highlight should be -1, -1
      expect(virtualEditor.getHighlightedCodeAtActionIndex(0)).toEqual("");
      expect(virtualEditor.getHighlightedCodeAtActionIndex(1)).toEqual("");
      // assert - highlighted code after 2nd action should be 'def'
      expect(virtualEditor.getHighlightedCodeAtActionIndex(2)).toEqual("def");
      // assert - code after 3rd action should be 'abc\n123'
      expect(virtualEditor.getCodeAtActionIndex(4)).toEqual(`abc
123`);
      expect(virtualEditor.getHighlightedCodeAtActionIndex(4)).toEqual("");
    })

    // it("should have correct state for everything at every step", () => {
    //   const virtualEditor = new VirtualEditor([]);
    //   const highlightExampleActions: IAction[] = [
    //     // 0
    //     {
    //       name: "type-editor",
    //       value:
    //         "// Here is a super long commart",
    //     },
    //     // 1
    //     {
    //       name: "arrow-left",
    //       value:
    //         "7",
    //     },
    //     // 2
    //     {
    //       name: "speak-before",
    //       value: "Oops, little typo here...",
    //     },
    //     // 3
    //     {
    //       name: "shift+arrow-left",
    //       value: "7",
    //     },
    //     // 4
    //     {
    //       name: "speak-before",
    //       value:
    //         "I'll just delete it and fix it.",
    //     },
    //     // 5
    //     {
    //       name: "backspace",
    //       value: "1",
    //     },
    //     // 6
    //     {
    //       name: "type-editor",
    //       value:
    //         "comment",
    //     },
    //     // 7
    //     {
    //       name: "speak-before",
    //       value: "There we go, all fixed!",
    //     }
    //   ];
    //   virtualEditor.applyActions(highlightExampleActions);
    //   const dataForAnnotatedFrames =
    //     virtualEditor.getDataForAnnotatedFrames();
    //   // +1 due to initialization
    //   expect(dataForAnnotatedFrames.length).toEqual(
    //     highlightExampleActions.length + 1
    //   );
      

    //   // index 4: speak-before - check that the highlight and caret positions are correct
    //   expect(dataForAnnotatedFrames[4].code).toEqual("// Here is a super long commart");
    //   expect(dataForAnnotatedFrames[4].highlightStartPosition).toEqual({
    //     col: 32, 
    //     row: 0
    //   });
    //   expect(dataForAnnotatedFrames[4].caretPosition).toEqual({
    //     col: 25,
    //     row: 0,
    //   });

    //   // index 5: delete should delete the entire highlighted section
    //   expect(dataForAnnotatedFrames[5].code).toEqual("// Here is a super long ");
    //   // highlight start should be null
    //   expect(dataForAnnotatedFrames[5].highlightStartPosition).toBeNull();
    // });
  });
});
