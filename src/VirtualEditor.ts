import {
  CodeAction,
  IAction,
  SpeakAction,
  ISpeechCaption,
  isCodeAction,
  isSpeakAction,
  isRepeatableAction,
} from "@fullstackcraftllc/codevideo-types";

/**
 * Represents a virtual editor that can be manipulated by a series of actions.
 */
export class VirtualEditor {
  private caretRow = 0; // 'X'
  private caretColumn = 0; // 'Y'
  private highlightStartRow = 0;
  private highlightStartColumn = 0;
  private codeLines: Array<string>;
  private actionsApplied: Array<IAction>;
  private codeActionsApplied: Array<CodeAction>;
  private speakActionsApplied: Array<SpeakAction>;
  private verbose: boolean = false;
  private codeLinesHistory: Array<Array<string>> = [];
  private speechCaptionHistory: Array<ISpeechCaption> = [];
  private caretPositionHistory: Array<{ row: number; column: number }> = [];
  private highlightStartPositionHistory: Array<{ row: number; column: number }> = [];
  private currentlyHighlightedCode: string = "";
  private highlightHistory: Array<Array<string>> = [];

  constructor(initialCodeLines: Array<string>, actions?: Array<IAction>, verbose?: boolean) {
    // handle case if initialCodeLines is empty - we need at least one line
    if (initialCodeLines.length === 0) {
      initialCodeLines = [""];
    }
    // now consistently set the initial state
    this.codeLines = initialCodeLines;
    this.actionsApplied = [
      { name: "type-editor", value: initialCodeLines.join("\n") },
    ];
    this.codeActionsApplied = [
      { name: "type-editor", value: initialCodeLines.join("\n") },
    ];
    this.codeLinesHistory = [];
    this.codeLinesHistory.push(initialCodeLines.slice());
    this.highlightHistory = [];
    this.highlightHistory.push([""]);
    this.speakActionsApplied = [];
    this.speechCaptionHistory = [{ speechType: "", speechValue: "" }];
    this.caretPositionHistory = [{ row: 0, column: 0 }];
    this.highlightStartPositionHistory = [{ row: -1, column: -1 }];

    // if actions are provided, apply them
    if (actions) {
      this.applyActions(actions);
    }
  }

  /**
   * Applies a series of actions to the virtual editor.
   * @param actions The actions to apply.
   * @returns The code after the actions have been applied.
   */
  applyActions(actions: Array<IAction>): string {
    actions.forEach((action) => {
      this.applyAction(action);
    });

    return this.getCode();
  }

  /**
   * Applies a single action to the virtual editor.
   * @param action The action to apply.
   * @returns The code after the action has been applied. Note the code can be identical to a previous step if the action applied was not a code action.
   */
  applyAction(action: IAction): string {
    // parse number out from action.value
    // if it fails we know it is something else like a code string, so default numTimes to 1
    let numTimes = 1;
    if (isRepeatableAction(action)) {
      numTimes = parseInt(action.value);
    }
    this.currentlyHighlightedCode = "";
    const currentLineLength = this.codeLines[this.caretRow].length;
    switch (action.name) {
      case "enter":
        if (this.highlightStartRow !== -1) {
          // Get correct start and end positions regardless of selection direction
          const isForwardSelection =
            this.highlightStartRow < this.caretRow ||
            (this.highlightStartRow === this.caretRow &&
              this.highlightStartColumn <= this.caretColumn);

          const startRow = isForwardSelection ? this.highlightStartRow : this.caretRow;
          const endRow = isForwardSelection ? this.caretRow : this.highlightStartRow;
          const startCol = isForwardSelection
            ? this.highlightStartColumn
            : this.caretColumn;
          const endCol = isForwardSelection
            ? this.caretColumn
            : this.highlightStartColumn;

          // Delete highlighted text
          const beforeText = this.codeLines[startRow].substring(0, startCol);
          const afterText = this.codeLines[endRow].substring(endCol);

          // Replace startRow with beforeText
          this.codeLines[startRow] = beforeText;

          // Remove lines between startRow and endRow
          if (endRow > startRow) {
            this.codeLines.splice(startRow + 1, endRow - startRow);
          }

          // Insert numTimes blank lines
          const newLines = Array(numTimes).fill("");

          // Insert afterText at the end of newLines, only if it's not empty
          if (afterText !== "") {
            newLines.push(afterText);
          }

          // Insert newLines after startRow
          this.codeLines.splice(startRow + 1, 0, ...newLines);

          // if after text is defined, move caret to the start of the last line inserted
          if (afterText !== "") {
            this.caretRow = startRow + numTimes + 1;
            this.caretColumn = 0;
          } else {
            // Move caret to the last blank line inserted
            this.caretRow = startRow + numTimes;
            this.caretColumn = 0;
          }

          // Clear the highlight after insertion
          this.clearCurrentHighlightedCode();
        } else {
          // Existing code for handling multiple enters without highlight
          for (let i = 0; i < numTimes; i++) {
            const currentLine = this.codeLines[this.caretRow];
            const beforeCaret = currentLine.substring(0, this.caretColumn);
            const afterCaret = currentLine.substring(this.caretColumn);

            // Update current line to contain only text before caret
            this.codeLines[this.caretRow] = beforeCaret;

            // Insert new line with text after caret
            this.codeLines.splice(this.caretRow + 1, 0, afterCaret);

            // Move caret to start of new line
            this.caretRow++;
            this.caretColumn = 0;
          }
        }
        break;
      case "type-editor":
        // if highlight is defined, delete everything between the caret position and the highlight position, and insert the typed text at the caret position
        if (this.highlightStartRow !== -1) {
          const startRow = this.highlightStartRow;
          const startColumn = this.highlightStartColumn;
          const endRow = this.caretRow;
          const endColumn = this.caretColumn;
          if (startRow === endRow) {
            this.codeLines[startRow] =
              this.codeLines[startRow].substring(0, startColumn) +
              this.codeLines[startRow].substring(endColumn);
          } else {
            this.codeLines[startRow] =
              this.codeLines[startRow].substring(0, startColumn) +
              this.codeLines[endRow].substring(endColumn);
            this.codeLines.splice(startRow + 1, endRow - startRow);
          }
          this.caretRow = startRow;
          this.caretColumn = startColumn;
          this.clearCurrentHighlightedCode();
        }
        // with type-editor, the caret is always at the end of the typed text
        const typedStringLength = action.value.length;
        for (let i = 0; i < numTimes; i++) {
          this.codeLines[this.caretRow] =
            this.codeLines[this.caretRow].substring(0, this.caretColumn) +
            action.value +
            this.codeLines[this.caretRow].substring(this.caretColumn);
          this.caretColumn += typedStringLength;
        }
        break;
      case "arrow-down":
        // for numTimes, move the caret down if the current row is not the last row
        for (let i = 0; i < numTimes; i++) {
          if (this.caretRow < this.codeLines.length - 1) {
            this.caretRow++;
          }
        }
        this.clearCurrentHighlightedCode();
        break;
      case "arrow-up":
        // for numTimes, move the caret up if the current row is not the first row
        for (let i = 0; i < numTimes; i++) {
          if (this.caretRow > 0) {
            this.caretRow--;
          }
        }
        this.clearCurrentHighlightedCode();
        break;
      case "arrow-right":
        // for numTimes, move the caret right - if we are at the end of a line and there are more lines below the current line, move to the start of the next line
        for (let i = 0; i < numTimes; i++) {
          if (this.caretColumn < currentLineLength - 1) {
            this.caretColumn++;
          } else if (this.caretRow < this.codeLines.length - 1) {
            this.caretRow++;
            this.caretColumn = 0;
          }
        }
        this.clearCurrentHighlightedCode();
        break;
      case "arrow-left":
        // for numTimes, move the caret left - if we are at the start of a line and there are more lines above the current line, move to the end of the previous line
        for (let i = 0; i < numTimes; i++) {
          if (this.caretColumn > 0) {
            this.caretColumn--;
          } else if (this.caretRow > 0) {
            this.caretRow--;
            this.caretColumn = this.codeLines[this.caretRow].length - 1;
          }
        }
        this.clearCurrentHighlightedCode();
        break;
      case "backspace":
        if (this.highlightStartRow !== -1) {
          // Get correct start and end positions regardless of selection direction
          const startRow = Math.min(this.highlightStartRow, this.caretRow);
          const endRow = Math.max(this.highlightStartRow, this.caretRow);
          const isForwardSelection = this.highlightStartRow < this.caretRow;

          const startCol = isForwardSelection ?
            this.highlightStartColumn : this.caretColumn;
          const endCol = isForwardSelection ?
            this.caretColumn : this.highlightStartColumn;

          if (startRow === endRow) {
            // Single line deletion
            const start = Math.min(startCol, endCol);
            const end = Math.max(startCol, endCol);
            this.codeLines[startRow] =
              this.codeLines[startRow].substring(0, start) +
              this.codeLines[startRow].substring(end);
            this.caretRow = startRow;
            this.caretColumn = start;
          } else {
            // Multi-line deletion
            const firstLineStart = this.codeLines[startRow].substring(0, startCol);
            const lastLineEnd = this.codeLines[endRow].substring(endCol);

            this.codeLines[startRow] = firstLineStart + lastLineEnd;
            this.codeLines.splice(startRow + 1, endRow - startRow);

            this.caretRow = startRow;
            this.caretColumn = startCol;
          }
          this.clearCurrentHighlightedCode();
        } else {
          // Standard backspace behavior unchanged
          for (let i = 0; i < numTimes; i++) {
            if (this.caretColumn > 0) {
              this.codeLines[this.caretRow] =
                this.codeLines[this.caretRow].substring(0, this.caretColumn - 1) +
                this.codeLines[this.caretRow].substring(this.caretColumn);
              this.caretColumn--;
            } else if (this.caretRow > 0) {
              const previousLineLength = this.codeLines[this.caretRow - 1].length;
              this.codeLines[this.caretRow - 1] += this.codeLines[this.caretRow];
              this.codeLines.splice(this.caretRow, 1);
              this.caretRow--;
              this.caretColumn = previousLineLength;
            }
          }
        }
        break;
      case "space":
        // if highlight is defined, delete everything between the caret position and the highlight position
        if (this.highlightStartRow !== -1) {
          const startRow = Math.min(this.highlightStartRow, this.caretRow);
          const endRow = Math.max(this.highlightStartRow, this.caretRow);
          const startCol = startRow === this.highlightStartRow ?
            this.highlightStartColumn : this.caretColumn;
          const endCol = endRow === this.highlightStartRow ?
            this.highlightStartColumn : this.caretColumn;

          if (startRow === endRow) {
            const start = Math.min(startCol, endCol);
            const end = Math.max(startCol, endCol);
            this.codeLines[startRow] =
              this.codeLines[startRow].substring(0, start) +
              this.codeLines[startRow].substring(end);
            // After deleting selection, put caret at start position
            this.caretRow = startRow;
            this.caretColumn = start;
          } else {
            // Multi-line case
            const firstLineStart = this.codeLines[startRow].substring(0, startCol);
            const lastLineEnd = this.codeLines[endRow].substring(endCol);

            this.codeLines[startRow] = firstLineStart + lastLineEnd;
            this.codeLines.splice(startRow + 1, endRow - startRow);

            this.caretRow = startRow;
            this.caretColumn = startCol;
          }
          this.clearCurrentHighlightedCode();
        }

        // Insert spaces one at a time to properly handle the numTimes parameter
        for (let i = 0; i < numTimes; i++) {
          this.codeLines[this.caretRow] =
            this.codeLines[this.caretRow].substring(0, this.caretColumn) +
            " " +
            this.codeLines[this.caretRow].substring(this.caretColumn);
          this.caretColumn++;
        }
        break;
      case "tab":
        // for numTimes, insert a tab at the current caret position
        for (let i = 0; i < numTimes; i++) {
          this.codeLines[this.caretRow] =
            this.codeLines[this.caretRow].substring(0, this.caretColumn) +
            "\t" +
            this.codeLines[this.caretRow].substring(this.caretColumn);
          this.caretColumn++;
        }
        break;
      case "command-left":
        // for numTimes, move the caret to the start of the current line if the current caretColumn is not 0
        for (let i = 0; i < numTimes; i++) {
          if (this.caretColumn > 0) {
            this.caretColumn = 0;
          }
        }
        // Clear any existing highlight when moving cursor
        this.clearCurrentHighlightedCode();
        break;
      case "command-right":
        // for numTimes, move the caret to the end of the current line 
        for (let i = 0; i < numTimes; i++) {
          if (this.caretColumn < this.codeLines[this.caretRow].length) {
            this.caretColumn = this.codeLines[this.caretRow].length;
          }
        }
        // Clear any existing highlight when moving cursor
        this.clearCurrentHighlightedCode();
        break;
      case "shift+arrow-right":
        // If no highlight exists yet, set the start position
        if (this.highlightStartRow === -1) {
          this.highlightStartRow = this.caretRow;
          this.highlightStartColumn = this.caretColumn;
        }

        // Move caret right for numTimes
        for (let i = 0; i < numTimes; i++) {
          if (this.caretColumn < this.codeLines[this.caretRow].length) {
            this.caretColumn++;
          } else if (this.caretRow < this.codeLines.length - 1) {
            this.caretRow++;
            this.caretColumn = 0;
          }
        }

        this.currentlyHighlightedCode = this.calculateHighlightedText();
        break;


      case "shift+arrow-left":
        // If no highlight exists yet, set the start position
        if (this.highlightStartRow === -1) {
          this.highlightStartRow = this.caretRow;
          this.highlightStartColumn = this.caretColumn;
        }

        // Move caret left for numTimes
        for (let i = 0; i < numTimes; i++) {
          if (this.caretColumn > 0) {
            this.caretColumn--;
          } else if (this.caretRow > 0) {
            this.caretRow--;
            this.caretColumn = this.codeLines[this.caretRow].length;
          }
        }

        this.currentlyHighlightedCode = this.calculateHighlightedText();
        break;

      case "speak-before":
      case "speak-after":
      case "speak-during":
        // known actions, but nothing to do here. they are appended to proper models as
        break;
      default:
        console.log(
          `WARNING: Action ${action.name} not recognized. Skipping...`
        );
        break;
    }

    // ALWAYS append the action to the end of the actionsApplied
    this.actionsApplied.push(action);

    // append code actions to code actions applied
    if (isCodeAction(action)) {
      this.codeActionsApplied.push(action);
    }

    // append speak actions to speak actions applied
    if (isSpeakAction(action)) {
      this.speakActionsApplied.push(action);
      // can also push to speechCaptionHistory
      this.speechCaptionHistory.push({
        speechType: action.name,
        speechValue: action.value,
      });
    } else {
      // if its not a speak action, push an empty speechCaption to the history
      this.speechCaptionHistory.push({
        speechType: "",
        speechValue: "",
      });
    }

    // Append a copy of the current code lines to the code history
    const codeLinesCopy = this.codeLines.slice();
    this.codeLinesHistory.push(codeLinesCopy);
    this.caretPositionHistory.push({
      row: this.caretRow,
      column: this.caretColumn,
    });

    // always append the highlight history, even if it is empty i.e. (-1, -1)
    this.highlightStartPositionHistory.push({
      row: this.highlightStartRow === -1 ? -1 : this.highlightStartRow,
      column: this.highlightStartColumn === -1 ? -1 : this.highlightStartColumn,
    });

    this.highlightHistory.push(
      this.currentlyHighlightedCode === ""
        ? [""]
        : [this.currentlyHighlightedCode]
    );

    // If verbose is true, log the action and the current code
    if (this.verbose) {
      console.log(this.getCodeLines());
    }

    // Return the code after the action has been applied
    return this.getCode();
  }

  /**
   * Returns the code lines of the virtual editor.
   * @returns The code lines of the virtual editor.
   */
  getCodeLines(): Array<string> {
    return this.codeLines;
  }

  /**
   * Returns the current caret position of the virtual editor.
   * @returns The current caret position of the virtual editor.
   */
  getCurrentCaretPosition(): { row: number; column: number } {
    return { row: this.caretRow, column: this.caretColumn };
  }

  // Helper function to calculate highlighted text
  calculateHighlightedText(): string {
    if (this.highlightStartRow === -1) return "";

    if (this.caretRow === this.highlightStartRow) {
      // Single line highlight
      const start = Math.min(this.highlightStartColumn, this.caretColumn);
      const end = Math.max(this.highlightStartColumn, this.caretColumn);
      return this.codeLines[this.caretRow].substring(start, end);
    }

    // Multi-line highlight
    const highlightedLines = [];
    const startRow = Math.min(this.highlightStartRow, this.caretRow);
    const endRow = Math.max(this.highlightStartRow, this.caretRow);
    const isForwardSelection = this.highlightStartRow < this.caretRow;

    for (let row = startRow; row <= endRow; row++) {
      if (row === startRow) {
        // First line - take from selection start to end of line
        const startCol = isForwardSelection ? this.highlightStartColumn : this.caretColumn;
        highlightedLines.push(this.codeLines[row].substring(startCol));
      } else if (row === endRow) {
        // Last line - take from start of line to selection end
        const endCol = isForwardSelection ? this.caretColumn : this.highlightStartColumn;
        highlightedLines.push(this.codeLines[row].substring(0, endCol));
      } else {
        // Middle lines - take entire line
        highlightedLines.push(this.codeLines[row]);
      }
    }
    return highlightedLines.join('\n');
  }

  /**
   * Returns the current highlight code of the virtual editor.
   * @returns The current highlight code of the virtual editor.
   */
  getCurrentHighlightedCode(): string {
    return this.currentlyHighlightedCode;
  }

  /**
   * Clears the current highlight code of the virtual editor. (Resets the highlight start row and column to -1)
   */
  clearCurrentHighlightedCode() {
    this.highlightStartRow = -1;
    this.highlightStartColumn = -1;
    this.currentlyHighlightedCode = "";
  }

  /**
   * Sets the current caret position of the virtual editor.
   * @param row The row to set the caret position to.
   * @param column The column to set the caret position to.
   */
  setCurrentCaretPosition(row: number, column: number) {
    this.caretRow = row;
    this.caretColumn = column;
  }

  /**
   * Gets the actions applied to the virtual editor.
   * @returns The actions applied to the virtual editor.
   */
  getActionsApplied(): Array<IAction> {
    return this.actionsApplied;
  }

  /**
   * Gets the code after the actions have been applied.
   * @returns The code after the actions have been applied.
   */
  getCode(): string {
    return this.codeLines.join("\n");
  }

  /**
   * Gets the code at a specific action index that has been applied.
   * @param actionIndex The index of the action to get the code after.
   * @returns The code after the action has been applied.
   * @throws An error if the action index is out of bounds.
   */
  getCodeAtActionIndex(actionIndex: number): string {
    if (actionIndex > this.codeLinesHistory.length - 1) {
      throw new Error("Action index out of bounds");
    }
    return this.codeLinesHistory[actionIndex].join("\n");
  }

  /**
   * Gets the highlighted code at a specific action index that has been applied.
   * @param actionIndex The index of the action to get the highlighted code after.
   * @returns The highlighted code after the action has been applied.
   * @throws An error if the action index is out of bounds.
   */
  getHighlightedCodeAtActionIndex(actionIndex: number): string {
    if (actionIndex > this.highlightHistory.length - 1) {
      throw new Error("Action index out of bounds");
    }
    return this.highlightHistory[actionIndex].join("\n");
  }

  /**
   * Returns an array of code lines at each step.
   * @returns An array of code lines at each step.
   */
  getCodeLinesHistory(): Array<Array<string>> {
    return this.codeLinesHistory;
  }

  getSpeakActionsApplied(): Array<SpeakAction> {
    return this.speakActionsApplied;
  }

  getSpeechCaptionHistory(): Array<ISpeechCaption> {
    return this.speechCaptionHistory;
  }

  getCodeActionsApplied(): Array<CodeAction> {
    return this.codeActionsApplied;
  }

  getCodeAfterEachStep(): Array<string> {
    return this.codeLinesHistory.map((codeLines) => codeLines.join("\n"));
  }

  getEditorStateAfterEachStep(): Array<{
    code: string;
    caretPosition: { row: number; col: number };
  }> {
    return this.codeLinesHistory.map((codeLines, index) => {
      return {
        code: codeLines.join("\n"),
        caretPosition: {
          row: this.caretPositionHistory[index].row,
          col: this.caretPositionHistory[index].column,
        },
      };
    });
  }

  getDataForAnnotatedFrames(): Array<{
    actionApplied: IAction;
    code: string;
    highlightStartPosition: null | { row: number; col: number };
    highlightedCode: string;
    caretPosition: { row: number; col: number };
    speechCaptions: Array<ISpeechCaption>;
  }> {
    return this.actionsApplied.map((actionApplied, index) => {
      const speechCaptions = []
      if (isSpeakAction(actionApplied)) {
        speechCaptions.push({
          speechType: actionApplied.name,
          speechValue: actionApplied.value,
        });
      }
      return {
        actionApplied: this.actionsApplied[index],
        code: this.getCodeAtActionIndex(index),
        highlightStartPosition: this.highlightStartPositionHistory[index].row !== -1 ? {
          row: this.highlightStartPositionHistory[index].row,
          col: this.highlightStartPositionHistory[index].column,
        } : null,
        highlightedCode: this.highlightHistory[index].join("\n"),
        caretPosition: {
          row: this.caretPositionHistory[index].row,
          col: this.caretPositionHistory[index].column,
        },
        speechCaptions,
      };
    });
  }
}
