import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";

describe("VirtualEditor", () => {
    describe("Save Examples", () => {
        it("editor is saved after issuing editor-save action", () => {
            const virtualEditor = new VirtualEditor([]);
            expect(virtualEditor.getIsSaved()).toEqual(false);
            virtualEditor.applyActions([{ name: "editor-save", value: "" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
        });

        it("any type of edit action reverts the editor to unsaved state", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);

            // typing action
            virtualEditor.applyActions([{ name: "editor-save", value: "" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
            virtualEditor.applyActions([{ name: "editor-type", value: "edit!" }]);
            expect(virtualEditor.getIsSaved()).toEqual(false);

            // space action
            virtualEditor.applyActions([{ name: "editor-save", value: "" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
            virtualEditor.applyActions([{ name: "editor-space", value: "1" }]);
            expect(virtualEditor.getIsSaved()).toEqual(false);

            // backspace action
            virtualEditor.applyActions([{ name: "editor-save", value: "" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
            virtualEditor.applyActions([{ name: "editor-backspace", value: "1" }]);
            expect(virtualEditor.getIsSaved()).toEqual(false);
        })

        it("any type of non-edit (navigation) type actions do not affect the saved state", () => {
            const virtualEditor = new VirtualEditor([
                'console.log("Hello World!");',
            ]);

            // arrow action
            virtualEditor.applyActions([{ name: "editor-save", value: "" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
            virtualEditor.applyActions([{ name: "editor-arrow-right", value: "1" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);

            // command action
            virtualEditor.applyActions([{ name: "editor-save", value: "" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
            virtualEditor.applyActions([{ name: "editor-command-right", value: "1" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);

            // shift arrow up action
            virtualEditor.applyActions([{ name: "editor-save", value: "" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
            virtualEditor.applyActions([{ name: "editor-shift+arrow-up", value: "1" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);

            // shift arrow down action
            virtualEditor.applyActions([{ name: "editor-save", value: "" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
            virtualEditor.applyActions([{ name: "editor-shift+arrow-down", value: "1" }]);
            expect(virtualEditor.getIsSaved()).toEqual(true);
        })
    });
});