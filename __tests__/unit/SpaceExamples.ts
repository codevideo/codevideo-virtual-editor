import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";

describe("VirtualEditor", () => {
    describe("Space Examples", () => {
        it("should add space at the beginning of a line", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);
            virtualEditor.applyActions([{ name: "editor-space", value: "1" }]);
            expect(virtualEditor.getCode()).toEqual(
                ' console.log("Hello World!");'
            );
        });

        it("should add space at the end of a line", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);
            virtualEditor.applyActions([
                { name: "editor-command-right", value: "1" },
                { name: "editor-space", value: "1" },
            ]);
            expect(virtualEditor.getCode()).toEqual(
                'console.log("Hello World!"); '
            );
        });

        it("should add space in the middle of a line with character content", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);
            virtualEditor.applyActions([
                { name: "editor-arrow-right", value: "3" },
                { name: "editor-space", value: "1" },
            ]);
            expect(virtualEditor.getCode()).toEqual(
                'con sole.log("Hello World!");'
            );
        });

        it("should handle multiple spaces added consecutively", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);
            virtualEditor.applyActions([{ name: "editor-space", value: "3" }]);
            expect(virtualEditor.getCode()).toEqual(
                '   console.log("Hello World!");'
            );
        });
    });
});