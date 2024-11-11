import { VirtualCodeBlock } from "../../src/VirtualCodeBlock";
import { describe, expect } from "@jest/globals";

describe("VirtualCodeBlock", () => {
    describe("Enter Examples", () => {
        it("should handle multiple enter actions", () => {
            const virtualCodeBlock = new VirtualCodeBlock([
                'console.log("Hello World!");',
            ]);
            console.log(virtualCodeBlock.getCode());
            console.log(virtualCodeBlock.getCurrentCaretPosition());

            virtualCodeBlock.applyActions([{ name: "enter", value: "3" }]);
            console.log(virtualCodeBlock.getCode());
            console.log(virtualCodeBlock.getCurrentCaretPosition());
            expect(virtualCodeBlock.getCode()).toEqual(`


console.log("Hello World!");`
            );
        });

        it("should handle multiple enter actions when there is a highlight", () => {
            const virtualCodeBlock = new VirtualCodeBlock([
                'console.log("Hello-123 World!");',
            ]);
            virtualCodeBlock.applyActions([
                { name: "arrow-right", value: "19" },
                { name: "shift+arrow-right", value: "3" },
                { name: "enter", value: "3" },
                { name: "type-editor", value: "// comment" }
            ]);
            console.log(virtualCodeBlock.getCode());
            expect(virtualCodeBlock.getCode()).toEqual(`console.log("Hello-


// comment World!");`);
        })
    });
});