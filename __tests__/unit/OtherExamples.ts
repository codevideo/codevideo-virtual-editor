import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";
import { IAction } from "@fullstackcraftllc/codevideo-types";

describe("VirtualEditor", () => {
  describe("applyActions", () => {
    it("should initialize all arrays consistently if the initial code is empty", () => {
      const virtualEditor = new VirtualEditor([]);
      expect(virtualEditor.getCodeLines()).toEqual([""]);
      expect(virtualEditor.getEditorActionsApplied()).toEqual([{ name: "editor-type", value: "" }]);
      expect(virtualEditor.getCodeLinesHistory()).toEqual([[""]]);
    });

    it("should keep caret at (1, 1) if initialized with a multiple lines of code", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
        'console.log("Hello World!");',
      ]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 1,
        col: 1,
      });
    });

    it("should create a new empty line at the beginning of a line", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([
        { name: "editor-arrow-up", value: "1" },
        { name: "editor-enter", value: "1" },
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
        { name: "editor-arrow-right", value: "8" },
        { name: "editor-enter", value: "1" },
      ]);
      expect(virtualEditor.getCode()).toEqual(
        'console.\nlog("Hello World!");'
      );
    });

    it("should handle arrow-down action at the end of code", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([{ name: "editor-arrow-down", value: "1" }]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 1,
        col: 1,
      });
    });

    it("should handle arrow-up action at the beginning of code", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([{ name: "editor-arrow-up", value: "1" }]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 1,
        col: 1,
      });
    });

    it("should bring the caret to the start of the current line with command-left", () => {
      const virtualEditor = new VirtualEditor([
        'console.log("Hello World!");',
      ]);
      virtualEditor.applyActions([
        { name: "editor-arrow-right", value: "5" },
        { name: "editor-command-left", value: "1" },
      ]);
      expect(virtualEditor.getCurrentCaretPosition().row).toEqual(1);
      expect(virtualEditor.getCurrentCaretPosition().col).toEqual(1);
    });

    it("should bring the caret to the end of the current line with command-right", () => {
      const code = 'console.log("Hello World!");';
      const virtualEditor = new VirtualEditor([code]);
      virtualEditor.applyActions([{ name: "editor-command-right", value: "1" }]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 1,
        col: code.length+1,
      });
    });

    it("should handle writing multiple lines, going back up to the top line, entering a few empty spaces, then going back to the top again and writing some comments", () => {
      const virtualEditor = new VirtualEditor([], [], false);
      virtualEditor.applyActions([
        { name: "editor-type", value: "const someFunction = () => {" },
        { name: "editor-enter", value: "1" },
        { name: "editor-type", value: "    console.log('hello world!')" },
        { name: "editor-enter", value: "1" },
        { name: "editor-type", value: "}" },
        { name: "editor-arrow-up", value: "2" },
        { name: "editor-command-left", value: "1" },
        { name: "editor-enter", value: "3" },
        { name: "editor-arrow-up", value: "2" },
        { name: "editor-type", value: "// This is a comment" },
        { name: "editor-arrow-down", value: "1" },
        { name: "editor-type", value: "// And here is another" },
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
      const virtualEditor = new VirtualEditor([], [], false);
      const actions: Array<IAction> = [
        { name: "author-speak-before", value: "Let's get this lesson started" },
        { name: "editor-type", value: "const someFunction = () => {" },
        { name: "editor-enter", value: "1" },
        { name: "editor-type", value: "    console.log('hello world!')" },
        { name: "editor-enter", value: "1" },
        { name: "editor-type", value: "}" },
        { name: "author-speak-after", value: "In the middle of a lesson!" },
        { name: "editor-arrow-up", value: "2" },
        { name: "editor-command-left", value: "1" },
        { name: "editor-enter", value: "3" },
        { name: "editor-arrow-up", value: "2" },
        { name: "editor-type", value: "// This is a comment" },
        { name: "editor-arrow-down", value: "1" },
        { name: "editor-type", value: "// And here is another" },
        { name: "author-speak-after", value: "And that's the end of the lesson!" },
      ];
      virtualEditor.applyActions(actions);
      actions.unshift({ name: "editor-type", value: "" });
      expect(virtualEditor.getActionsApplied()).toEqual(actions);
      expect(virtualEditor.getEditorActionsApplied()).toEqual([
        { name: "editor-type", value: "" },
        { name: "editor-type", value: "const someFunction = () => {" },
        { name: "editor-enter", value: "1" },
        { name: "editor-type", value: "    console.log('hello world!')" },
        { name: "editor-enter", value: "1" },
        { name: "editor-type", value: "}" },
        { name: "editor-arrow-up", value: "2" },
        { name: "editor-command-left", value: "1" },
        { name: "editor-enter", value: "3" },
        { name: "editor-arrow-up", value: "2" },
        { name: "editor-type", value: "// This is a comment" },
        { name: "editor-arrow-down", value: "1" },
        { name: "editor-type", value: "// And here is another" },
      ]);
    });

    it("should show code history as expected", () => {
      const virtualEditor = new VirtualEditor([], [], false);
      virtualEditor.applyActions([
        { name: "editor-type", value: "const someFunction = () => {" },
        { name: "editor-enter", value: "1" },
        { name: "editor-type", value: "    console.log('hello world!')" },
        { name: "editor-enter", value: "1" },
        { name: "editor-type", value: "}" },
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
      const virtualEditor = new VirtualEditor([], [], false);
      virtualEditor.applyActions([{ name: "editor-enter", value: "1" }]);
      const codeLines = virtualEditor.getCodeLines();
      expect(codeLines.length).toEqual(2);
      expect(codeLines[0]).toEqual("");
      expect(codeLines[1]).toEqual("");
    });

    it("should have the correct final caret position with a step by step example", () => {
      const virtualEditor = new VirtualEditor([], [], false);
      virtualEditor.applyAction(
        { name: "editor-type", value: "12345" }
      );
      expect(virtualEditor.getCode()).toEqual("12345");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 1,
        col: 6, 
      });
      virtualEditor.applyAction(
        { name: "editor-arrow-left", value: "3" }
      );
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 1,
        col: 3, 
      });
      virtualEditor.applyAction(
        { name: "editor-type", value: "abc" }
      );
      expect(virtualEditor.getCode()).toEqual("12abc345");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 1,
        col: 6, 
      });
    });

    it("should have the correct final caret if we type within the middle of a line", () => {
      const virtualEditor = new VirtualEditor([], [], false);
      virtualEditor.applyActions([
        { name: "editor-type", value: "12345678910" },
        { name: "editor-arrow-left", value: "5" },
        { name: "editor-type", value: "abc" },
      ]);
      expect(virtualEditor.getCode()).toEqual("123456abc78910");
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 1,
        col: 10, 
      });
    });

    it("should have the correct final caret location after some complex steps", () => {
      const virtualEditor = new VirtualEditor([], [], false);
      virtualEditor.applyActions([
        {
          name: "author-speak-before",
          value:
            "Let's learn how to use the console.log function in JavaScript!",
        },
        {
          name: "author-speak-before",
          value:
            "First, to make it clear that this is a JavaScript file, I'll just put a comment here",
        },
        {
          name: "editor-type",
          value: "// index.js",
        },
        {
          name: "editor-enter",
          value: "1",
        },
        {
          name: "author-speak-before",
          value:
            "For starters, let's just print 'Hello world!' to the console.",
        },
        {
          name: "editor-type",
          value: "console.log('Hello, world!');",
        },
        {
          name: "author-speak-before",
          value:
            "and if I wanted to write the value of some variable to the console, I could do that like so:",
        },
        {
          name: "editor-backspace",
          value: "29",
        },
        {
          name: "editor-type",
          value: "const myVariable = 5;",
        },
        {
          name: "editor-enter",
          value: "1",
        },
        {
          name: "editor-type",
          value: "console.log(myVariable);",
        },
        {
          name: "author-speak-before",
          value:
            "Now, when I run this code, I would expect the value of 'myVariable' to be printed to the console. Something like:",
        },
        {
          name: "editor-enter",
          value: "1",
        },
        {
          name: "editor-type",
          value: "// 5",
        },
        {
          name: "author-speak-before",
          value: "Console logging is simple, yet powerful and very useful!",
        },
      ]);
      expect(virtualEditor.getCurrentCaretPosition()).toEqual({
        row: 4,
        col: 5,
      });
    });
  });
});
