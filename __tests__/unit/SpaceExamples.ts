import { VirtualCodeBlock } from "../../src/VirtualCodeBlock";
import { describe, expect } from "@jest/globals";

describe("VirtualCodeBlock", () => {
    describe("Space Examples", () => {
        it("should add space at the beginning of a line", () => {
            const virtualCodeBlock = new VirtualCodeBlock([
                'console.log("Hello World!");',
            ]);
            virtualCodeBlock.applyActions([{ name: "space", value: "1" }]);
            expect(virtualCodeBlock.getCode()).toEqual(
                ' console.log("Hello World!");'
            );
        });

        it("should add space at the end of a line", () => {
            const virtualCodeBlock = new VirtualCodeBlock([
                'console.log("Hello World!");',
            ]);
            virtualCodeBlock.applyActions([
                { name: "command-right", value: "1" },
                { name: "space", value: "1" },
            ]);
            expect(virtualCodeBlock.getCode()).toEqual(
                'console.log("Hello World!"); '
            );
        });

        it("should add space in the middle of a line with character content", () => {
            const virtualCodeBlock = new VirtualCodeBlock([
                'console.log("Hello World!");',
            ]);
            virtualCodeBlock.applyActions([
                { name: "arrow-right", value: "3" },
                { name: "space", value: "1" },
            ]);
            expect(virtualCodeBlock.getCode()).toEqual(
                'con sole.log("Hello World!");'
            );
        });

        it("should handle multiple spaces added consecutively", () => {
            const virtualCodeBlock = new VirtualCodeBlock([
                'console.log("Hello World!");',
            ]);
            virtualCodeBlock.applyActions([{ name: "space", value: "3" }]);
            expect(virtualCodeBlock.getCode()).toEqual(
                '   console.log("Hello World!");'
            );
        });
    });
});