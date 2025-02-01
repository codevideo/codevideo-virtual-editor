import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";

describe("VirtualEditor", () => {
    describe("Enter Examples", () => {
        //         it("should handle empty code with one enter", () => {
        //             const virtualEditor = new VirtualEditor([], [], true);
        //             virtualEditor.applyActions([{ name: "editor-enter", value: "1" }]);
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 2, col: 1 });
        //             expect(virtualEditor.getCodeLines()).toEqual(["", ""]);
        //             expect(virtualEditor.getCode()).toEqual(`
        // `
        //             );

        //         });
        //         it("should handle a single enter action", () => {
        //             const virtualEditor = new VirtualEditor(['bob'], [], true);
        //             virtualEditor.applyActions([{ name: "editor-enter", value: "1" }]);
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 2, col: 1 });
        //             expect(virtualEditor.getCodeLines()).toEqual(["", 'bob']);
        //             expect(virtualEditor.getCode()).toEqual(`
        // bob`
        //             );

        //         });

        //         it("should handle a two enter actions", () => {
        //             const virtualEditor = new VirtualEditor(['bob']);
        //             virtualEditor.applyActions([{ name: "editor-enter", value: "2" }]);
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 3, col: 1 });
        //             expect(virtualEditor.getCodeLines()).toEqual(["", "", 'bob']);
        //             expect(virtualEditor.getCode()).toEqual(`

        // bob`
        //             );

        //         });

        //         it("should handle multiple single enter actions", () => {
        //             const virtualEditor = new VirtualEditor(['console.log("Hello World!");']);
        //             virtualEditor.applyActions([{ name: "editor-enter", value: "1" }]);
        //             virtualEditor.applyActions([{ name: "editor-enter", value: "1" }]);
        //             virtualEditor.applyActions([{ name: "editor-enter", value: "1" }]);
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 1 });
        //             expect(virtualEditor.getCode()).toEqual(`


        // console.log("Hello World!");`
        //             );
        //         });
        //         it("should handle multiple enter actions", () => {
        //             const virtualEditor = new VirtualEditor(['console.log("Hello World!");']);
        //             virtualEditor.applyActions([{ name: "editor-enter", value: "3" }]);
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 1 });
        //             expect(virtualEditor.getCodeLines()).toEqual(["", "", "", 'console.log("Hello World!");']);
        //             expect(virtualEditor.getCode()).toEqual(`


        // console.log("Hello World!");`
        //             );
        //         });

        //         it("should handle multiple enter actions when there is a highlight", () => {
        //             const virtualEditor = new VirtualEditor(['console.log("Hello-123 World!");']);
        //             virtualEditor.applyActions([
        //                 { name: "editor-arrow-right", value: "19" },
        //                 { name: "editor-shift+arrow-right", value: "3" },
        //                 { name: "editor-enter", value: "3" },
        //                 { name: "editor-type", value: "// comment" }
        //             ]);
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 10 });
        //             expect(virtualEditor.getCodeLines()).toEqual(["console.log(\"Hello-", "", "", "// comment World!\");"]);
        //             expect(virtualEditor.getCode()).toEqual(`console.log("Hello-


        // // comment World!");`);
        //         })

        //         it("should not be a dumb fuck with applyActions", () => {
        //             const virtualEditor = new VirtualEditor(['console.log("Hello-123 World!");']);
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 1 });
        //             virtualEditor.applyActions([
        //                 { name: "editor-arrow-right", value: "19" },
        //             ]);
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 20 });
        //             virtualEditor.applyActions([
        //                 { name: "editor-shift+arrow-right", value: "3" },
        //             ])
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 23 });
        //             virtualEditor.applyActions([
        //                 { name: "editor-enter", value: "3" },
        //             ])
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 1 });
        //             virtualEditor.applyActions([
        //                 { name: "editor-type", value: "// comment" }
        //             ])
        //             expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 10 });
        //             expect(virtualEditor.getCodeLines()).toEqual(["console.log(\"Hello-", "", "", "// comment World!\");"]);
        //             expect(virtualEditor.getCode()).toEqual(`console.log("Hello-


        // // comment World!");`);
        //         });

        it("should not be a dumb fuck with applyAction", () => {
            const virtualEditor = new VirtualEditor(['console.log("Hello-123 World!");']);
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 1 });
            virtualEditor.applyAction(
                { name: "editor-arrow-right", value: "19" }, // moves us to before the '1'
            );
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 20 });
            virtualEditor.applyAction(
                { name: "editor-shift+arrow-right", value: "3" }, // highlights the '123'
            )
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 23 });
            virtualEditor.applyAction(
                { name: "editor-enter", value: "3" }, // carry the remaining ' World!");' with us
            )
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 1 });
            virtualEditor.applyAction(
                { name: "editor-type", value: "// comment" } // type '// comment' in front of the ' World!");'
            )
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 11 });
            expect(virtualEditor.getCodeLines()).toEqual(["console.log(\"Hello-", "", "", "// comment World!\");"]);
            expect(virtualEditor.getCode()).toEqual(`console.log("Hello-


// comment World!");`);
        })

        it("should handle multiple enter actions when there is code further down beyond where enters are being made", () => {
            const virtualEditor = new VirtualEditor(['xyz789', '', '', 'abc', '123']);
            expect(virtualEditor.getCode()).toEqual(`xyz789


abc
123`);
            virtualEditor.applyAction(
                { name: "editor-arrow-right", value: "3" }, // should put us before the 7
            );
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 4 });
            virtualEditor.applyAction({ name: "editor-enter", value: "3" }); // moves the 789 down 3 lines
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 1 });
            expect(virtualEditor.getCodeLines()).toEqual(["xyz", "", "", "789", "", "", "abc", "123"]);
            expect(virtualEditor.getCode()).toEqual(`xyz


789


abc
123`);
        });
    });
});