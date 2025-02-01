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
          name: "editor-type",
          value:
            "abcdef",
        },
        // 2
        {
          name: "editor-shift+arrow-left",
          value:
            "3",
        },
        // 3
        {
          name: "editor-backspace",
          value: "1",
        },
        // 4
        {
          name: "editor-type",
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
      virtualEditor.applyAction(
        {
          name: "editor-type",
          value:
            "abcdef",
        })
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("");

      virtualEditor.applyAction({
        name: "editor-shift+arrow-left",
        value:
          "3",
      })
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("def");

      virtualEditor.applyAction({
        name: "editor-enter",
        value: "1",
      })

      // enter clears the highlight
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("");

      virtualEditor.applyAction({
        name: "editor-type",
        value:
          "123",
      })


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

    it("handles forward highlighting over multiple lines with immediate typing", () => {
      const virtualEditor = new VirtualEditor(["one", "one two", "one two three"]);
      virtualEditor.applyAction({ name: "editor-shift+arrow-right", value: "3" }); // highlights the whole first line
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("one");
      virtualEditor.applyAction({ name: "editor-shift+arrow-down", value: "1" }); // highlights until the end of line 2
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("one\none");
      virtualEditor.applyAction({ name: "editor-shift+arrow-down", value: "1" }); // highlights the rest of line two and also the first word of line 3
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("one\none two\none");
      virtualEditor.applyAction({ name: "editor-type", value: "GONE" }); // types GONE
      expect(virtualEditor.getCode()).toEqual(`GONE two three`);
    });

    it("handles backward highlighting over multiple lines with immediate typing", () => {
      const virtualEditor = new VirtualEditor(["one", "one two", "one two three"]);
      virtualEditor.applyAction({ name: "editor-arrow-down", value: "2" }); // moves caret to the end of line 2 (last line)
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 3, col: 1 });
      virtualEditor.applyAction({ name: "editor-arrow-right", value: "20" }); // moves caret to the end of the line, even with many overdraft, but we don't exceed the length of the line
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 3, col: 14 });
      virtualEditor.applyAction({ name: "editor-shift+arrow-left", value: "9" }); // highlights the 'two three' in line 3
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("two three");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 3, col: 5 });
      virtualEditor.applyAction({ name: "editor-shift+arrow-up", value: "1" }); // highlights the rest of line 3 and also the last word of line 2
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 2, col: 5 });
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("two\none two three");
      virtualEditor.applyAction({ name: "editor-shift+arrow-up", value: "1" }); // highlights the rest of line 2 but is at the end of line 1
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 4 });
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("\none two\none two three");
      virtualEditor.applyAction({ name: "editor-backspace", value: "1" }); // deletes highlighted code, but we are still at the end of line 1 i.e. whole 'one' is still in tact
      expect(virtualEditor.getCode()).toEqual(`one`);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 4 });
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("");
      virtualEditor.applyAction({ name: "editor-type", value: "TEST" }); // types TEST
      expect(virtualEditor.getCode()).toEqual(`oneTEST`);
    });

    it("handles forward highlighting over multiple lines with immediate typing on a LONG line", () => {
      const virtualEditor = new VirtualEditor(["one", "one two asdf asdf asdf asdf asdf asdf", "one two three"]);
      virtualEditor.applyAction({ name: "editor-shift+arrow-right", value: "3" }); // highlights the whole first line
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("one");
      virtualEditor.applyAction({ name: "editor-shift+arrow-down", value: "1" }); // highlights until the end of line 2
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("one\none");
      virtualEditor.applyAction({ name: "editor-shift+arrow-down", value: "1" }); // highlights the rest of line two and also the first word of line 3
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("one\none two asdf asdf asdf asdf asdf asdf\none");
      virtualEditor.applyAction({ name: "editor-type", value: "GONE" }); // types GONE
      expect(virtualEditor.getCode()).toEqual(`GONE two three`);
    });

    it("should have correct state for everything at every step", () => {
      const virtualEditor = new VirtualEditor([]);

      // 0
      virtualEditor.applyAction({
        name: "editor-type",
        value:
          "// Here is a super long commart",
      });
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 32 });
      // 1
      virtualEditor.applyAction({
        name: "author-speak-before",
        value: "Oops, little typo here...",
      })
      // 2
      virtualEditor.applyAction({
        name: "editor-shift+arrow-left",
        value: "7",
      })
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("commart");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 25 });
      // 3
      virtualEditor.applyAction({
        name: "author-speak-before",
        value:
          "I'll just delete it and fix it.",
      })
      // 4
      virtualEditor.applyAction({
        name: "editor-backspace",
        value: "1",
      })
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 25 });
      // 5
      virtualEditor.applyAction({
        name: "editor-type",
        value:
          "comment",
      })
      // 6
      virtualEditor.applyAction({
        name: "author-speak-before",
        value: "There we go, all fixed!",
      })
      expect(virtualEditor.getCurrentHighlightedCode()).toEqual("");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 32 });
    });
  });
});
