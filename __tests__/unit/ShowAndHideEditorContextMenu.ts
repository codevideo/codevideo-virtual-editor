import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";

describe("VirtualEditor", () => {
    describe("Show and hide editor context menu", () => {
        it("should report that the context menu is open after issuing the show context menu action", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);
            virtualEditor.applyActions([{ name: "editor-show-context-menu", value: "1" }]);
            expect(virtualEditor.getIsEditorContextMenuOpen()).toEqual(true);
        });

        it("should report that the context menu is closed after issuing the show context menu action", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);
            virtualEditor.applyActions([{ name: "editor-hide-context-menu", value: "1" }]);
            expect(virtualEditor.getIsEditorContextMenuOpen()).toEqual(false);
        });
    });
});