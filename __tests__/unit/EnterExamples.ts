import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";

describe("VirtualEditor", () => {
    describe("Enter Examples", () => {
        it("should handle multiple enter actions", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);
            console.log(virtualEditor.getCode());
            console.log(virtualEditor.getCurrentCaretPosition());

            virtualEditor.applyActions([{ name: "enter", value: "3" }]);
            console.log(virtualEditor.getCode());
            console.log(virtualEditor.getCurrentCaretPosition());
            expect(virtualEditor.getCode()).toEqual(`


console.log("Hello World!");`
            );
        });

        it("should handle multiple enter actions when there is a highlight", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello-123 World!");',
            ]);
            virtualEditor.applyActions([
                { name: "arrow-right", value: "19" },
                { name: "shift+arrow-right", value: "3" },
                { name: "enter", value: "3" },
                { name: "type-editor", value: "// comment" }
            ]);
            console.log(virtualEditor.getCode());
            expect(virtualEditor.getCode()).toEqual(`console.log("Hello-


// comment World!");`);
        })
    });
});