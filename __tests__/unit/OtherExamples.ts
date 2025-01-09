import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";
import { IAction } from "@fullstackcraftllc/codevideo-types";

describe("VirtualEditor", () => {
  describe("applyActions", () => {
    it("should initialize all arrays consistently if the initial code is empty", () => {
      const virtualEditor = new VirtualEditor([]);
      expect(virtualEditor.getCodeLines()).toEqual([""]);
      expect(virtualEditor.getCodeActionsApplied()).toEqual([{ name: "type-editor", value: "" }]);
      expect(virtualEditor.getCodeLinesHistory()).toEqual([[""]]);
      expect(virtualEditor.getSpeakActionsApplied()).toEqual([]);
      expect(virtualEditor.getSpeechCaptionHistory()).toEqual([{ speechType: "", speechValue: "" }]);
    });

    it("should create a new empty line at the beginning of a line", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([
        { name: "arrow-up", value: "1" },
        { name: "enter", value: "1" },
      ]);
      expect(virtualEditor.getCode()).toEqual(
        '\nconsole.log("Hello World!");'
      );
    });

    it("should split a line with text in the middle when enter is applied", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([
        { name: "arrow-right", value: "8" },
        { name: "enter", value: "1" },
      ]);
      expect(virtualEditor.getCode()).toEqual(
        'console.\nlog("Hello World!");'
      );
    });

    it("should handle arrow-down action at the end of code", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([{ name: "arrow-down", value: "1" }]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 0,
        column: 0,
      });
    });

    it("should handle arrow-up action at the beginning of code", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([{ name: "arrow-up", value: "1" }]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 0,
        column: 0,
      });
    });

    it("should bring the caret to the start of the current line with command-left", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([
        { name: "arrow-right", value: "5" },
        { name: "command-left", value: "1" },
      ]);
      expect(virtualEditor.getCurrentCaretPosition().row).toEqual(0);
      expect(virtualEditor.getCurrentCaretPosition().column).toEqual(0);
    });

    it("should bring the caret to the end of the current line with command-right", () => {
      const code = 'console.log("Hello World!");';
      const virtualEditor = new VirtualEditor([code]);
      virtualEditor.applyActions([{ name: "command-right", value: "1" }]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 0,
        column: code.length,
      });
    });

    it("should handle writing multiple lines, going back up to the top line, entering a few empty spaces, then going back to the top again and writing some comments", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      virtualEditor.applyActions([
        { name: "type-editor", value: "const someFunction = () => {" },
        { name: "enter", value: "1" },
        { name: "type-editor", value: "    console.log('hello world!')" },
        { name: "enter", value: "1" },
        { name: "type-editor", value: "}" },
        { name: "arrow-up", value: "2" },
        { name: "command-left", value: "1" },
        { name: "enter", value: "3" },
        { name: "arrow-up", value: "2" },
        { name: "type-editor", value: "// This is a comment" },
        { name: "arrow-down", value: "1" },
        { name: "type-editor", value: "// And here is another" },
      ]);
      expect(virtualEditor.getCode()).toEqual(
        `
// This is a comment
// And here is another
const someFunction = () => {
    console.log('hello world!')
}`
      );
    });

    it("should should have all resulting history arrays as expected", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      const actions: Array<IAction> = [
        { name: "speak-before", value: "Let's get this lesson started" },
        { name: "type-editor", value: "const someFunction = () => {" },
        { name: "enter", value: "1" },
        { name: "type-editor", value: "    console.log('hello world!')" },
        { name: "enter", value: "1" },
        { name: "type-editor", value: "}" },
        { name: "speak-after", value: "In the middle of a lesson!" },
        { name: "arrow-up", value: "2" },
        { name: "command-left", value: "1" },
        { name: "enter", value: "3" },
        { name: "arrow-up", value: "2" },
        { name: "type-editor", value: "// This is a comment" },
        { name: "arrow-down", value: "1" },
        { name: "type-editor", value: "// And here is another" },
        { name: "speak-after", value: "And that's the end of the lesson!" },
      ];
      virtualEditor.applyActions(actions);
      actions.unshift({ name: "type-editor", value: "" });
      expect(virtualEditor.getActionsApplied()).toEqual(actions);
      expect(virtualEditor.getSpeakActionsApplied()).toEqual([
        { name: "speak-before", value: "Let's get this lesson started" },
        { name: "speak-after", value: "In the middle of a lesson!" },
        { name: "speak-after", value: "And that's the end of the lesson!" },
      ]);
      expect(virtualEditor.getCodeActionsApplied()).toEqual([
        { name: "type-editor", value: "" },
        { name: "type-editor", value: "const someFunction = () => {" },
        { name: "enter", value: "1" },
        { name: "type-editor", value: "    console.log('hello world!')" },
        { name: "enter", value: "1" },
        { name: "type-editor", value: "}" },
        { name: "arrow-up", value: "2" },
        { name: "command-left", value: "1" },
        { name: "enter", value: "3" },
        { name: "arrow-up", value: "2" },
        { name: "type-editor", value: "// This is a comment" },
        { name: "arrow-down", value: "1" },
        { name: "type-editor", value: "// And here is another" },
      ]);
    });

    it("should show code history as expected", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      virtualEditor.applyActions([
        { name: "type-editor", value: "const someFunction = () => {" },
        { name: "enter", value: "1" },
        { name: "type-editor", value: "    console.log('hello world!')" },
        { name: "enter", value: "1" },
        { name: "type-editor", value: "}" },
      ]);
      const codeLinesHistory = virtualEditor.getCodeLinesHistory();
      expect(codeLinesHistory.length).toEqual(6);
      expect(codeLinesHistory[0]).toEqual([""]);
      expect(codeLinesHistory[1]).toEqual(["const someFunction = () => {"]);
      expect(codeLinesHistory[2]).toEqual(["const someFunction = () => {", ""]);
      expect(codeLinesHistory[3]).toEqual([
        "const someFunction = () => {",
        "    console.log('hello world!')",
      ]);
      expect(codeLinesHistory[4]).toEqual([
        "const someFunction = () => {",
        "    console.log('hello world!')",
        "",
      ]);
      expect(codeLinesHistory[5]).toEqual([
        "const someFunction = () => {",
        "    console.log('hello world!')",
        "}",
      ]);
    });

    it("should show two empty lines in codelines after enter is applied", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      virtualEditor.applyActions([{ name: "enter", value: "1" }]);
      const codeLines = virtualEditor.getCodeLines();
      expect(codeLines.length).toEqual(2);
      expect(codeLines[0]).toEqual("");
      expect(codeLines[1]).toEqual("");
    });

    it("should have the correct final caret position with a step by step example", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      virtualEditor.applyAction(
        { name: "type-editor", value: "12345" }
      );
      expect(virtualEditor.getCode()).toEqual("12345");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 0,
        column: 5, 
      });
      virtualEditor.applyAction(
        { name: "arrow-left", value: "3" }
      );
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 0,
        column: 2, 
      });
      virtualEditor.applyAction(
        { name: "type-editor", value: "abc" }
      );
      expect(virtualEditor.getCode()).toEqual("12abc345");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 0,
        column: 5, 
      });
    });

    it("should have the correct final caret if we type within the middle of a line", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      virtualEditor.applyActions([
        { name: "type-editor", value: "12345678910" },
        { name: "arrow-left", value: "5" },
        { name: "type-editor", value: "abc" },
      ]);
      expect(virtualEditor.getCode()).toEqual("123456abc78910");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 0,
        column: 9, 
      });
    });

    it("should have the correct final caret location after some complex steps", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      virtualEditor.applyActions([
        {
          name: "speak-before",
          value:
            "Let's learn how to use the console.log function in JavaScript!",
        },
        {
          name: "speak-before",
          value:
            "First, to make it clear that this is a JavaScript file, I'll just put a comment here",
        },
        {
          name: "type-editor",
          value: "// index.js",
        },
        {
          name: "enter",
          value: "1",
        },
        {
          name: "speak-before",
          value:
            "For starters, let's just print 'Hello world!' to the console.",
        },
        {
          name: "type-editor",
          value: "console.log('Hello, world!');",
        },
        {
          name: "speak-before",
          value:
            "and if I wanted to write the value of some variable to the console, I could do that like so:",
        },
        {
          name: "backspace",
          value: "29",
        },
        {
          name: "type-editor",
          value: "const myVariable = 5;",
        },
        {
          name: "enter",
          value: "1",
        },
        {
          name: "type-editor",
          value: "console.log(myVariable);",
        },
        {
          name: "speak-before",
          value:
            "Now, when I run this code, I would expect the value of 'myVariable' to be printed to the console. Something like:",
        },
        {
          name: "enter",
          value: "1",
        },
        {
          name: "type-editor",
          value: "// 5",
        },
        {
          name: "speak-before",
          value: "Console logging is simple, yet powerful and very useful!",
        },
      ]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 3,
        column: 4,
      });
    });
  });

  describe("getDataForAnnotatedFrames", () => {

    it("should work with a single type-editor action", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      virtualEditor.applyActions([{ name: "type-editor", value: "12345" }]);
      expect(virtualEditor.getActionsApplied()).toEqual([
        { name: "type-editor", value: "" },
        { name: "type-editor", value: "12345" },
      ]);
      expect(virtualEditor.getCodeActionsApplied()).toEqual([
        { name: "type-editor", value: "" },
        { name: "type-editor", value: "12345" },
      ]);
      expect(virtualEditor.getCode()).toEqual("12345");
      const codeLinesHistory = virtualEditor.getCodeLinesHistory();
      expect(codeLinesHistory.length).toEqual(2);
      expect(codeLinesHistory[0]).toEqual([""]);
      expect(codeLinesHistory[1]).toEqual(["12345"]);
      const dataForAnnotatedFrames = virtualEditor.getDataForAnnotatedFrames();
      expect(dataForAnnotatedFrames.length).toEqual(2);
      expect(dataForAnnotatedFrames[1].actionApplied).toEqual({
        name: "type-editor",
        value: "12345",
      });
      expect(dataForAnnotatedFrames[1].code).toEqual("12345");
      expect(dataForAnnotatedFrames[1].caretPosition).toEqual({ row: 0, col: 5 });
      expect(dataForAnnotatedFrames[1].speechCaptions).toEqual([]);
    });

    it("should have the correct history for a complex one line example", () => {
      const virtualEditor = new VirtualEditor([], [], true);
      virtualEditor.applyActions([
        { name: "type-editor", value: "12345678910" },
        { name: "backspace", value: "5" },
        { name: "type-editor", value: "abc" },
      ]);

      const dataForAnnotatedFrames = virtualEditor.getDataForAnnotatedFrames();
      expect(dataForAnnotatedFrames.length).toEqual(4);
      expect(dataForAnnotatedFrames[0].actionApplied).toEqual({
        name: "type-editor",
        value: "",
      });
      expect(dataForAnnotatedFrames[0].code).toEqual("");
      expect(dataForAnnotatedFrames[0].caretPosition).toEqual({ row: 0, col: 0 });
      expect(dataForAnnotatedFrames[0].speechCaptions).toEqual([]);


      expect(dataForAnnotatedFrames[1].actionApplied).toEqual({
        name: "type-editor",
        value: "12345678910",
      });
      expect(dataForAnnotatedFrames[1].code).toEqual("12345678910");
      expect(dataForAnnotatedFrames[1].caretPosition).toEqual({ row: 0, col: 11 });
      expect(dataForAnnotatedFrames[1].speechCaptions).toEqual([]);

      expect(dataForAnnotatedFrames[2].actionApplied).toEqual({
        name: "backspace",
        value: "5",
      });
      expect(dataForAnnotatedFrames[2].code).toEqual("123456");
      expect(dataForAnnotatedFrames[2].caretPosition).toEqual({ row: 0, col: 6 });
      expect(dataForAnnotatedFrames[2].speechCaptions).toEqual([]);

      expect(dataForAnnotatedFrames[3].actionApplied).toEqual({
        name: "type-editor",
        value: "abc",
      });
      expect(dataForAnnotatedFrames[3].code).toEqual("123456abc");
      expect(dataForAnnotatedFrames[3].caretPosition).toEqual({ row: 0, col: 9 });
      expect(dataForAnnotatedFrames[3].speechCaptions).toEqual([]);
      
    });
  });
});
