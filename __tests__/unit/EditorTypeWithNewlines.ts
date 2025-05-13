import { VirtualEditor } from "../../src/VirtualEditor";
import { describe, expect } from "@jest/globals";

describe("VirtualEditor", () => {
    describe("Editor Type With Newlines", () => {
        it("should handle multiple editor-type actions with newlines and update caret row correctly", () => {
            const virtualEditor = new VirtualEditor([], [], true);
            
            // Apply the series of editor-type actions with newlines
            virtualEditor.applyActions([
                {
                    "name": "editor-type",
                    "value": "// We'll organize repos by environment for different projects\n"
                }
            ]);

            // Check the caret position after the first action
            // The caret should be at the end of the first line
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 2, col: 1 });

            virtualEditor.applyActions([
                {
                    "name": "editor-type",
                    "value": "const workRepoMap: Array<{ keywords: string[], repoPath: string}> = [\n"
                }
            ]);

            // Check the caret position after the second action
            // The caret should be at the end of the second line
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 3, col: 1 });
            
            virtualEditor.applyActions([
                {
                    "name": "editor-type",
                    "value": "    {\n"
                }
            ]);
            
            // Each action should increment the row since each ends with \n
            // Starting from row 1 (0-indexed)
            // After 1st action with \n: row 2
            // After 2nd action with \n: row 3  
            // After 3rd action with \n: row 4
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 4, col: 1 });
            
            // Check that the code lines are properly structured
            const codeLines = virtualEditor.getCodeLines();
            expect(codeLines).toEqual([
                "// We'll organize repos by environment for different projects",
                "const workRepoMap: Array<{ keywords: string[], repoPath: string}> = [",
                "    {",
                ""  // Empty line because the last action ends with \n
            ]);
            
            // Check the full code output
            const fullCode = virtualEditor.getCode();
            expect(fullCode).toBe(
                `// We'll organize repos by environment for different projects
const workRepoMap: Array<{ keywords: string[], repoPath: string}> = [
    {
`
            );
        });
        
        it("should handle type actions without newlines", () => {
            const virtualEditor = new VirtualEditor([], [], true);
            
            // Apply actions without newlines
            virtualEditor.applyActions([
                {
                    "name": "editor-type",
                    "value": "const hello = "
                },
                {
                    "name": "editor-type",
                    "value": '"world"'
                }
            ]);
            
            // Caret should stay on the same row since no newlines
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 22 });
            
            // Check that content is on single line
            const codeLines = virtualEditor.getCodeLines();
            expect(codeLines).toEqual([
                'const hello = "world"'
            ]);
        });

        it("should treat \\n as literal backslash-n characters and \n as actual newlines", () => {
            const virtualEditor = new VirtualEditor([], [], true);
            
            // First test: literal \n characters (should stay on same line)
            virtualEditor.applyActions([
                {
                    "name": "editor-type",
                    "value": "const text = \"hello\\nworld\";"  // literal \n characters
                }
            ]);
            
            // Should still be on row 1 with literal \n in the source
            expect(virtualEditor.getCurrentCaretPosition()).toEqual({ row: 1, col: 29 });
            expect(virtualEditor.getCodeLines()).toEqual([
                "const text = \"hello\\nworld\";"
            ]);
            
            // Reset editor
            const virtualEditor2 = new VirtualEditor([], [], true);
            
            // Second test: actual newline character (should create new line)
            virtualEditor2.applyActions([
                {
                    "name": "editor-type", 
                    "value": "line1\nline2"  // actual newline character
                }
            ]);
            
            // Should be on row 2 with actual line break
            expect(virtualEditor2.getCurrentCaretPosition()).toEqual({ row: 2, col: 6 });
            expect(virtualEditor2.getCodeLines()).toEqual([
                "line1",
                "line2"
            ]);
        });
    });
});
