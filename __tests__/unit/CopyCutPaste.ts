import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect, it } from "@jest/globals";
import { IAction, IClipboard } from "@fullstackcraftllc/codevideo-types";

// A clipboard the test can look into, standing in for the VirtualIDE's shared one.
const testClipboard = () => {
  const state = { text: "", isFullLine: false };
  const clipboard: IClipboard = {
    getText: () => state.text,
    isFullLine: () => state.isFullLine,
    setText: (text: string, isFullLine: boolean = false) => {
      if (text === "") return;
      state.text = text;
      state.isFullLine = isFullLine;
    },
  };
  return { clipboard, state };
};

const editorWith = (code: string, clipboard?: IClipboard) => new VirtualEditor(code.split("\n"), undefined, false, clipboard);

const act = (name: string, value: string = "1"): IAction => ({ name, value } as IAction);

describe("VirtualEditor", () => {
  describe("copy and paste a selection", () => {
    it("pastes a copied selection on another line", () => {
      const editor = editorWith("const a = 1;\nconst b = 2;");
      editor.applyActions([
        act("editor-command-right"),
        act("editor-shift+arrow-left", "12"),
        act("editor-command-c"),
        act("editor-arrow-down"),
        act("editor-command-right"),
        act("editor-enter"),
        act("editor-command-v"),
      ]);
      expect(editor.getCode()).toEqual("const a = 1;\nconst b = 2;\nconst a = 1;");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 3, col: 13 });
    });

    it("pastes once per press", () => {
      const editor = editorWith("hello world");
      editor.applyActions([
        act("editor-command-right"),
        act("editor-shift+arrow-left", "5"),
        act("editor-command-c"),
        act("editor-command-left"),
        act("editor-command-v", "2"),
      ]);
      expect(editor.getCode()).toEqual("worldworldhello world");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 1, col: 11 });
    });

    it("replaces the selected text when pasting", () => {
      const editor = editorWith("foo bar");
      editor.applyActions([
        act("editor-shift+arrow-right", "3"),
        act("editor-command-c"),
        act("editor-command-right"),
        act("editor-shift+arrow-left", "3"),
        act("editor-command-v"),
      ]);
      expect(editor.getCode()).toEqual("foo foo");
    });

    it("copies a backward selection across lines, line breaks included", () => {
      const editor = editorWith("a1\nb2\nc3");
      editor.applyActions([
        act("editor-arrow-down", "2"),
        act("editor-command-right"),
        act("editor-shift+arrow-left", "5"),
        act("editor-command-c"),
        act("editor-arrow-up"),
        act("editor-command-left"),
        act("editor-command-v"),
      ]);
      expect(editor.getCode()).toEqual("b2\nc3a1\nb2\nc3");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 2, col: 3 });
    });

    it("leaves the code, caret and selection alone when copying", () => {
      const editor = editorWith("keep me");
      editor.applyActions([act("editor-shift+arrow-right", "4")]);
      const before = { code: editor.getCode(), caret: editor.getCurrentCaretPosition(), selection: editor.getCurrentHighlightCoordinates() };
      editor.applyAction(act("editor-command-c"));
      expect({ code: editor.getCode(), caret: editor.getCurrentCaretPosition(), selection: editor.getCurrentHighlightCoordinates() }).toEqual(before);
    });

    it("does nothing when pasting an empty clipboard", () => {
      const editor = editorWith("unchanged");
      editor.applyActions([act("editor-save"), act("editor-command-v")]);
      expect(editor.getCode()).toEqual("unchanged");
      expect(editor.getIsSaved()).toBe(true);
    });
  });

  describe("cut", () => {
    it("deletes the selection, and pasting puts it back", () => {
      const { clipboard, state } = testClipboard();
      const editor = editorWith("abc def", clipboard);
      editor.applyActions([act("editor-command-right"), act("editor-shift+arrow-left", "3"), act("editor-command-x")]);
      expect(editor.getCode()).toEqual("abc ");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 1, col: 5 });
      expect(state).toEqual({ text: "def", isFullLine: false });
      editor.applyAction(act("editor-command-v"));
      expect(editor.getCode()).toEqual("abc def");
    });

    it("marks the file unsaved, while copying doesn't", () => {
      const editor = editorWith("abc");
      editor.applyActions([act("editor-save"), act("editor-command-c")]);
      expect(editor.getIsSaved()).toBe(true);
      editor.applyAction(act("editor-command-x"));
      expect(editor.getIsSaved()).toBe(false);
    });
  });

  describe("with nothing selected, as VS Code does", () => {
    it("copies the caret's whole line with its line break, flagged as a whole line", () => {
      const { clipboard, state } = testClipboard();
      const editor = editorWith("first\nsecond\nthird", clipboard);
      editor.applyActions([act("editor-arrow-down"), act("editor-arrow-right", "3"), act("editor-command-c")]);
      expect(state).toEqual({ text: "second\n", isFullLine: true });
    });

    it("pastes a whole line above the caret's line, and the caret stays with its own text", () => {
      const editor = editorWith("first\nsecond\nthird");
      editor.applyActions([
        act("editor-arrow-down"),
        act("editor-arrow-right", "3"),
        act("editor-command-c"),
        act("editor-arrow-down"),
        act("editor-command-v"),
      ]);
      expect(editor.getCode()).toEqual("first\nsecond\nsecond\nthird");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 4, col: 4 });
    });

    it("pastes a whole line over a selection like any other text", () => {
      const editor = editorWith("x\nkeep");
      editor.applyActions([
        act("editor-command-c"),
        act("editor-arrow-down"),
        act("editor-shift+arrow-right", "4"),
        act("editor-command-v"),
      ]);
      expect(editor.getCode()).toEqual("x\nx\n");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 3, col: 1 });
    });

    it("cuts a line with lines below it: the next line moves up, caret at its start", () => {
      const { clipboard, state } = testClipboard();
      const editor = editorWith("one\ntwo\nthree", clipboard);
      editor.applyActions([act("editor-arrow-down"), act("editor-arrow-right", "2"), act("editor-command-x")]);
      expect(editor.getCode()).toEqual("one\nthree");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 2, col: 1 });
      expect(state).toEqual({ text: "two\n", isFullLine: true });
      editor.applyAction(act("editor-command-v"));
      expect(editor.getCode()).toEqual("one\ntwo\nthree");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 3, col: 1 });
    });

    it("cuts the last line with the line break above it, caret at the end of the line above", () => {
      const editor = editorWith("one\ntwo");
      editor.applyActions([act("editor-arrow-down"), act("editor-command-x")]);
      expect(editor.getCode()).toEqual("one");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 1, col: 4 });
    });

    it("empties the only line", () => {
      const editor = editorWith("solo");
      editor.applyAction(act("editor-command-x"));
      expect(editor.getCode()).toEqual("");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 1, col: 1 });
      editor.applyAction(act("editor-command-v"));
      expect(editor.getCode()).toEqual("solo\n");
      expect(editor.getCurrentCaretPosition()).toEqual({ row: 2, col: 1 });
    });

    it("cuts a line per press, keeping the last one on the clipboard", () => {
      const { clipboard, state } = testClipboard();
      const editor = editorWith("a\nb\nc", clipboard);
      editor.applyAction(act("editor-command-x", "2"));
      expect(editor.getCode()).toEqual("c");
      expect(state.text).toEqual("b\n");
      editor.applyAction(act("editor-command-v"));
      expect(editor.getCode()).toEqual("b\nc");
    });
  });

  describe("a shared clipboard", () => {
    it("pastes in one editor what another copied", () => {
      const { clipboard } = testClipboard();
      const fileA = editorWith("export const fromA = 1;", clipboard);
      const fileB = editorWith("", clipboard);
      fileA.applyActions([act("editor-command-right"), act("editor-shift+arrow-left", "23"), act("editor-command-c")]);
      fileB.applyAction(act("editor-command-v"));
      expect(fileB.getCode()).toEqual("export const fromA = 1;");
    });

    it("can be given after the editor is made", () => {
      const { clipboard } = testClipboard();
      clipboard.setText("given later");
      const editor = editorWith("");
      editor.setClipboard(clipboard);
      editor.applyAction(act("editor-command-v"));
      expect(editor.getCode()).toEqual("given later");
    });
  });
});
