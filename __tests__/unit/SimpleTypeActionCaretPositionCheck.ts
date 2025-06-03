import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";

describe("VirtualEditor", () => {
    describe("Show work with simply type action", () => {
        it("should have proper caret position after typing with newlines", () => {
            const virtualEditor = new VirtualEditor([]);
            virtualEditor.applyActions([{ name: "editor-type", value: "123\nABC" }]);
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({row: 2, col: 4});
        });
    });
});