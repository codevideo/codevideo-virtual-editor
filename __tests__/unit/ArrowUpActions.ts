import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";

describe("VirtualEditor", () => {
    describe("Arrow Up Actions", () => {
        it("should move caret to the top line when using multiple editor-arrow-up actions", () => {
            const virtualEditor = new VirtualEditor([]);
            
            // Create several lines of code
            virtualEditor.applyActions([
                { name: "editor-type", value: "const line1 = 'first';" },
                { name: "editor-enter", value: "1" },
                { name: "editor-type", value: "const line2 = 'second';" },
                { name: "editor-enter", value: "1" },
                { name: "editor-type", value: "const line3 = 'third';" },
                { name: "editor-enter", value: "1" },
                { name: "editor-type", value: "const line4 = 'fourth';" }
            ]);
            
            // Should be on row 4
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 24 });
            
            // Move up multiple times (more than the number of lines)
            virtualEditor.applyActions([
                { name: "editor-arrow-up", value: "100" }
            ]);
            
            // Should be at the top (row 1), maintaining the column position if possible
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 24 });
            
            // Type something to verify we're on the right line
            virtualEditor.applyActions([
                { name: "editor-type", value: " updated" }
            ]);
            
            // Check that the first line was modified
            const codeLines = virtualEditor.getCodeLines();
            expect(codeLines[0]).toContain("updated");
            expect(codeLines[0]).toBe("const line1 = 'first'; updated");
            
            // Other lines should remain unchanged
            expect(codeLines[1]).toBe("const line2 = 'second';");
            expect(codeLines[2]).toBe("const line3 = 'third';");
            expect(codeLines[3]).toBe("const line4 = 'fourth';");
        });
        
        it("should handle arrow-up when already at the top line", () => {
            const virtualEditor = new VirtualEditor([]);
            
            // Create one line
            virtualEditor.applyActions([
                { name: "editor-type", value: "const onlyLine = true;" }
            ]);
            
            // Try moving up when already at top
            virtualEditor.applyActions([
                { name: "editor-arrow-up", value: "10" }
            ]);
            
            // Should stay on row 1
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 23 });
        });
        
        it("should properly track caret column when moving up between lines of different lengths", () => {
            const virtualEditor = new VirtualEditor([]);
            
            // Create lines of different lengths
            virtualEditor.applyActions([
                { name: "editor-type", value: "short" },
                { name: "editor-enter", value: "1" },
                { name: "editor-type", value: "much longer line here" }
            ]);
            
            // Should be at end of longer line
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 2, col: 22 });
            
            // Move up to shorter line
            virtualEditor.applyActions([
                { name: "editor-arrow-up", value: "1" }
            ]);
            
            // Column should be clamped to the end of the shorter line
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 22 });
        });
    });
});