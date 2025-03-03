import {
  EditorAction,
  IAction,
  AuthorAction,
  ISpeechCaption,
  isEditorAction,
  isAuthorAction,
  isRepeatableAction,
  IEditorPosition,
} from "@fullstackcraftllc/codevideo-types";

/**
 * Represents a virtual editor that can be manipulated by a series of actions.
 */
export class VirtualEditor {
  /**
   * Represents the LOGICAL (0,0) referenced caret row position in the editor.
   * @private
   */
  private caretRow = 0; // 'X'

  /**
   * Represents the LOGICAL (0,0) referenced caret column position in the editor.
   * @private
   */
  private caretCol = 0; // 'Y'

  /**
   * Represents the LOGICAL (0,0) referenced highlight start row position in the editor. -1 represents no highlight.
   * @private
   */
  private highlightStartRow = -1;

  /**
   * Represents the LOGICAL (0,0) referenced highlight start column position in the editor. -1 represents no highlight.
   * @private
   */
  private highlightStartCol = -1;

  private codeLines: Array<string>;
  private actionsApplied: Array<IAction>;
  private editorActionsApplied: Array<EditorAction>;
  private authorActionsApplied: Array<AuthorAction>;
  private verbose: boolean = false;
  private codeLinesHistory: Array<Array<string>> = [];
  private speechCaptionHistory: Array<ISpeechCaption> = [];
  private caretPositionHistory: Array<IEditorPosition> = [];
  private highlightStartPositionHistory: Array<IEditorPosition> = [];
  private currentlyHighlightedCode: string = "";
  private highlightHistory: Array<Array<string>> = [];
  private isSaved: boolean = false;

  constructor(initialCodeLines: Array<string>, actions?: Array<IAction>, verbose?: boolean) {
    // handle case if initialCodeLines is empty - we need at least one line
    if (initialCodeLines.length === 0) {
      initialCodeLines = [""];
    }
    // now consistently set the initial state
    this.codeLines = initialCodeLines;
    this.actionsApplied = [
      { name: "editor-type", value: initialCodeLines.length === 1 ? initialCodeLines[0] : initialCodeLines.join("\n") },
    ];
    this.editorActionsApplied = [
      { name: "editor-type", value: initialCodeLines.length === 1 ? initialCodeLines[0] : initialCodeLines.join("\n") },
    ];
    this.codeLinesHistory = [];
    this.codeLinesHistory.push(initialCodeLines.slice());
    this.highlightHistory = [];
    this.highlightHistory.push([""]);
    this.authorActionsApplied = [];
    this.speechCaptionHistory = [];
    this.caretPositionHistory = [{ row: 0, col: 0 }];
    this.highlightStartPositionHistory = [{ row: -1, col: -1 }];

    // if actions are provided, apply them
    if (actions) {
      this.applyActions(actions);
    }

    // set verbose if provided
    if (verbose) {
      this.verbose = verbose;
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

    // in this switch, let the EditorActions and AuthorActions in codevideo-types guide you
    switch (action.name) {
      case "editor-enter":
        this.isSaved = false;
        if (this.verbose) {
          console.log("ENTER ACTION");
          console.log("this.highlightStartRow: ", this.highlightStartRow);
          console.log("this.highlightStartCol: ", this.highlightStartCol);
        }
        if (this.highlightStartRow !== -1) {
          // Get correct start and end positions regardless of selection direction
          const isForwardSelection =
            this.highlightStartRow < this.caretRow ||
            (this.highlightStartRow === this.caretRow &&
              this.highlightStartCol <= this.caretCol);

          const startRow = isForwardSelection ? this.highlightStartRow : this.caretRow;
          const endRow = isForwardSelection ? this.caretRow : this.highlightStartRow;
          const startCol = isForwardSelection
            ? this.highlightStartCol
            : this.caretCol;
          const endCol = isForwardSelection
            ? this.caretCol
            : this.highlightStartCol;

          // Delete highlighted text
          const beforeText = this.codeLines[startRow].substring(0, startCol);
          const afterText = this.codeLines[endRow].substring(endCol);

          // Replace startRow with beforeText
          this.codeLines[startRow] = beforeText;

          // Remove lines between startRow and endRow
          if (endRow > startRow) {
            this.codeLines.splice(startRow + 1, endRow - startRow);
          }

          // For the new content, first insert an 'enter' for numTimes
          const newContent = Array(numTimes-1).fill("");

          // push the afterText to the newContent (works even if it is empty!)
          newContent.push(afterText);

          // update caret position to be at the first column of the new line
          this.caretRow = startRow + numTimes;
          this.caretCol = 0;

          // insert newLines into codeLines at caretRow
          this.codeLines.splice(this.caretRow, 0, ...newContent);

          // Clear the highlight after insertion
          this.clearCurrentHighlightedCode();
        } else {
          // Existing code for handling multiple enters without highlight
          for (let i = 0; i < numTimes; i++) {
            const currentLine = this.codeLines[this.caretRow];
            const beforeCaret = currentLine.substring(0, this.caretCol);
            const afterCaret = currentLine.substring(this.caretCol);

            // log all
            if (this.verbose) {
              console.log("currentLine: ", currentLine);
              console.log("beforeCaret: ", beforeCaret);
              console.log("afterCaret: ", afterCaret);
            }

            // Update current line to contain only text before caret
            this.codeLines[this.caretRow] = beforeCaret;

            // Insert new line with text after caret
            this.codeLines.splice(this.caretRow + 1, 0, afterCaret);

            // Move caret to start of new line
            this.caretRow++;
            this.caretCol = 0;
          }
        }
        break;
      case "editor-type":
        this.isSaved = false;
        // if highlight is defined, delete everything between the caret position and the highlight position, and insert the typed text at the caret position
        if (this.highlightStartRow !== -1) {
          const startRow = this.highlightStartRow;
          const startColumn = this.highlightStartCol;
          const endRow = this.caretRow;
          const endColumn = this.caretCol;
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
          this.caretCol = startColumn;
          this.clearCurrentHighlightedCode();
        }
        // with type-editor, the caret is always at the end of the typed text
        const typedStringLength = action.value.length;
        for (let i = 0; i < numTimes; i++) {
          this.codeLines[this.caretRow] =
            this.codeLines[this.caretRow].substring(0, this.caretCol) +
            action.value +
            this.codeLines[this.caretRow].substring(this.caretCol);
          this.caretCol += typedStringLength;
        }
        break;
      case "editor-arrow-down":
        // for numTimes, move the caret down if the current row is not the last row
        for (let i = 0; i < numTimes; i++) {
          if (this.caretRow < this.codeLines.length - 1) {
            this.caretRow++;
          }
        }
        this.clearCurrentHighlightedCode();
        break;
      case "editor-arrow-up":
        // for numTimes, move the caret up if the current row is not the first row
        for (let i = 0; i < numTimes; i++) {
          if (this.caretRow > 0) {
            this.caretRow--;
          }
        }
        this.clearCurrentHighlightedCode();
        break;
      case "editor-arrow-right":
        // for numTimes, move the caret right - if we are at the end of a line and there are more lines below the current line, move to the start of the next line
        for (let i = 0; i < numTimes; i++) {
          if (this.caretCol < currentLineLength) {
            this.caretCol++;
          } else if (this.caretRow < this.codeLines.length - 1) {
            this.caretRow++;
            this.caretCol = 0;
          }
        }
        this.clearCurrentHighlightedCode();
        break;
      case "editor-arrow-left":
        // for numTimes, move the caret left - if we are at the start of a line and there are more lines above the current line, move to the end of the previous line
        for (let i = 0; i < numTimes; i++) {
          if (this.caretCol > 0) {
            this.caretCol--;
          } else if (this.caretRow > 0) {
            this.caretRow--;
            this.caretCol = this.codeLines[this.caretRow].length - 1;
          }
        }
        this.clearCurrentHighlightedCode();
        break;
      case "editor-backspace":
        this.isSaved = false;
        if (this.highlightStartRow !== -1) {
          // Get correct start and end positions regardless of selection direction
          const startRow = Math.min(this.highlightStartRow, this.caretRow);
          const endRow = Math.max(this.highlightStartRow, this.caretRow);
          const isForwardSelection = this.highlightStartRow < this.caretRow;

          const startCol = isForwardSelection ?
            this.highlightStartCol : this.caretCol;
          const endCol = isForwardSelection ?
            this.caretCol : this.highlightStartCol;

          if (startRow === endRow) {
            // Single line deletion
            const start = Math.min(startCol, endCol);
            const end = Math.max(startCol, endCol);
            this.codeLines[startRow] =
              this.codeLines[startRow].substring(0, start) +
              this.codeLines[startRow].substring(end);
            this.caretRow = startRow;
            this.caretCol = start;
          } else {
            // Multi-line deletion
            const firstLineStart = this.codeLines[startRow].substring(0, startCol);
            const lastLineEnd = this.codeLines[endRow].substring(endCol);

            this.codeLines[startRow] = firstLineStart + lastLineEnd;
            this.codeLines.splice(startRow + 1, endRow - startRow);

            this.caretRow = startRow;
            this.caretCol = startCol;
          }
          this.clearCurrentHighlightedCode();
        } else {
          // Standard backspace behavior unchanged
          for (let i = 0; i < numTimes; i++) {
            if (this.caretCol > 0) {
              this.codeLines[this.caretRow] =
                this.codeLines[this.caretRow].substring(0, this.caretCol - 1) +
                this.codeLines[this.caretRow].substring(this.caretCol);
              this.caretCol--;
            } else if (this.caretRow > 0) {
              const previousLineLength = this.codeLines[this.caretRow - 1].length;
              this.codeLines[this.caretRow - 1] += this.codeLines[this.caretRow];
              this.codeLines.splice(this.caretRow, 1);
              this.caretRow--;
              this.caretCol = previousLineLength;
            }
          }
        }
        break;
      case "editor-space":
        this.isSaved = false;
        // if highlight is defined, delete everything between the caret position and the highlight position
        if (this.highlightStartRow !== -1) {
          const startRow = Math.min(this.highlightStartRow, this.caretRow);
          const endRow = Math.max(this.highlightStartRow, this.caretRow);
          const startCol = startRow === this.highlightStartRow ?
            this.highlightStartCol : this.caretCol;
          const endCol = endRow === this.highlightStartRow ?
            this.highlightStartCol : this.caretCol;

          if (startRow === endRow) {
            const start = Math.min(startCol, endCol);
            const end = Math.max(startCol, endCol);
            this.codeLines[startRow] =
              this.codeLines[startRow].substring(0, start) +
              this.codeLines[startRow].substring(end);
            // After deleting selection, put caret at start position
            this.caretRow = startRow;
            this.caretCol = start;
          } else {
            // Multi-line case
            const firstLineStart = this.codeLines[startRow].substring(0, startCol);
            const lastLineEnd = this.codeLines[endRow].substring(endCol);

            this.codeLines[startRow] = firstLineStart + lastLineEnd;
            this.codeLines.splice(startRow + 1, endRow - startRow);

            this.caretRow = startRow;
            this.caretCol = startCol;
          }
          this.clearCurrentHighlightedCode();
        }

        // Insert spaces one at a time to properly handle the numTimes parameter
        for (let i = 0; i < numTimes; i++) {
          this.codeLines[this.caretRow] =
            this.codeLines[this.caretRow].substring(0, this.caretCol) +
            " " +
            this.codeLines[this.caretRow].substring(this.caretCol);
          this.caretCol++;
        }
        break;
      case "editor-tab":
        // for numTimes, insert a tab at the current caret position
        for (let i = 0; i < numTimes; i++) {
          this.codeLines[this.caretRow] =
            this.codeLines[this.caretRow].substring(0, this.caretCol) +
            "\t" +
            this.codeLines[this.caretRow].substring(this.caretCol);
          this.caretCol++;
        }
        break;
      case "editor-command-left":
        // for numTimes, move the caret to the start of the current line if the current caretColumn is not 0
        for (let i = 0; i < numTimes; i++) {
          if (this.caretCol > 0) {
            this.caretCol = 0;
          }
        }
        // Clear any existing highlight when moving cursor
        this.clearCurrentHighlightedCode();
        break;
      case "editor-command-right":
        // for numTimes, move the caret to the end of the current line 
        for (let i = 0; i < numTimes; i++) {
          if (this.caretCol < this.codeLines[this.caretRow].length) {
            this.caretCol = this.codeLines[this.caretRow].length;
          }
        }
        // Clear any existing highlight when moving cursor
        this.clearCurrentHighlightedCode();
        break;
      case "editor-shift+arrow-left":
        // If no highlight exists yet, set the start position
        if (this.highlightStartRow === -1) {
          this.highlightStartRow = this.caretRow;
          this.highlightStartCol = this.caretCol;
        }

        // Move caret left for numTimes
        for (let i = 0; i < numTimes; i++) {
          if (this.caretCol > 0) {
            this.caretCol--;
          } else if (this.caretRow > 0) {
            this.caretRow--;
            this.caretCol = this.codeLines[this.caretRow].length;
          }
        }

        this.currentlyHighlightedCode = this.calculateHighlightedText();
        break;
      case "editor-shift+arrow-right":
          // If no highlight exists yet, set the start position
          if (this.highlightStartRow === -1) {
            this.highlightStartRow = this.caretRow;
            this.highlightStartCol = this.caretCol;
          }
  
          // Move caret right for numTimes
          for (let i = 0; i < numTimes; i++) {
            if (this.caretCol < this.codeLines[this.caretRow].length) {
              this.caretCol++;
            } else if (this.caretRow < this.codeLines.length - 1) {
              this.caretRow++;
              this.caretCol = 0;
            }
          }
  
          this.currentlyHighlightedCode = this.calculateHighlightedText();
          break;
      case "editor-shift+arrow-down":
        // If no highlight exists yet, set the start position
        if (this.highlightStartRow === -1) {
          this.highlightStartRow = this.caretRow;
          this.highlightStartCol = this.caretCol;
        }

        // Move caret down for numTimes - if the next line has AT LEAST the same number of columns as the current line, move the caret down to the same column, otherwise move the caret to the end of the next line
        for (let i = 0; i < numTimes; i++) {
          if (this.caretRow < this.codeLines.length - 1) {
            const nextLineLength = this.codeLines[this.caretRow + 1].length;
            if (this.caretCol < nextLineLength) {
              this.caretRow++;
            } else {
              this.caretRow++;
              this.caretCol = nextLineLength;
            }
          }
        }

        this.currentlyHighlightedCode = this.calculateHighlightedText();
        break;
      case "editor-shift+arrow-up":
        // If no highlight exists yet, set the start position
        if (this.highlightStartRow === -1) {
          this.highlightStartRow = this.caretRow;
          this.highlightStartCol = this.caretCol;
        }

        // Move caret up for numTimes - if the previous line has AT LEAST the same number of columns as the current line, move the caret up to the same column, otherwise move the caret to the end of the previous line
        for (let i = 0; i < numTimes; i++) {
          if (this.caretRow > 0) {
            const previousLineLength = this.codeLines[this.caretRow - 1].length;
            if (this.caretCol < previousLineLength) {
              this.caretRow--;
            } else {
              this.caretRow--;
              this.caretCol = previousLineLength;
            }
          }
        }

        this.currentlyHighlightedCode = this.calculateHighlightedText();
        break;
        case "editor-save":
          this.isSaved = true;
          break;
      default:
        console.log(
          `WARNING: Action ${action.name} not recognized. Skipping... If this is an author or speak action those should eventually anyway be moved to VirtualAuthor - go yell at Chris to fix this.`
        );
        break;
    }

    // ALWAYS append the action to the end of the actionsApplied
    this.actionsApplied.push(action);

    // append editor actions to editor actions applied
    if (isEditorAction(action)) {
      this.editorActionsApplied.push(action);
    }

    // TODO: this block right here should be removed completely and captions should be built from leveraging codevideo-virtual-ide
    // append author actions to author actions applied
    if (isAuthorAction(action)) {
      this.authorActionsApplied.push(action);
      // can also push to speechCaptionHistory
      this.speechCaptionHistory.push({
        speechType: action.name,
        speechValue: action.value,
      });
    }

    // Append a copy of the current code lines to the code history
    const codeLinesCopy = this.codeLines.slice();
    this.codeLinesHistory.push(codeLinesCopy);
    this.caretPositionHistory.push({
      row: this.caretRow,
      col: this.caretCol,
    });

    // always append the highlight history, even if it is empty i.e. (-1, -1)
    this.highlightStartPositionHistory.push({
      row: this.highlightStartRow === -1 ? -1 : this.highlightStartRow,
      col: this.highlightStartCol === -1 ? -1 : this.highlightStartCol,
    });

    this.highlightHistory.push(
      this.currentlyHighlightedCode === ""
        ? [""]
        : [this.currentlyHighlightedCode]
    );

    // If verbose is true, log the action and the current code
    if (this.verbose) {
      console.log("PREVIOUS CODE:");
      console.log(`\`${this.getCodeAtActionIndex(this.actionsApplied.length - 2)}\``);
      console.log("APPLIED ACTION:");
      console.log(action);
      console.log("CURRENT CODE:");
      console.log(`\`${this.getCodeAtActionIndex(this.actionsApplied.length - 1)}\``);
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
   * Returns the PHYSICAL current caret position of the virtual editor, (1, 1) being the top left of the editor.
   * @returns The PHYSICAL current caret position of the virtual editor, (1, 1) being the top left of the editor.
   */
  getCurrentCaretPosition(): IEditorPosition {
    return { 
      row: this.caretRow + 1, 
      col: this.caretCol + 1 
    };
  }

  /**
   * Returns the PHYSICAL current highlight coordinates of the virtual editor, (1, 1) being the top left of the editor.
   * @returns The PHYSICAL current highlight coordinates of the virtual editor, (1, 1) being the top left of the editor.
   */
  getCurrentHighlightCoordinates(): { start: IEditorPosition; end: IEditorPosition } | null {
    // if no highlight exists, return null
    if (this.highlightStartRow === -1) {
      return null;
    }

    const start = {
      row: this.highlightStartRow + 1,
      col: this.highlightStartCol + 1,
    };

    const end = {
      row: this.caretRow + 1,
      col: this.caretCol + 1,
    };

    return { start, end };
  }

  /**
   * Returns the isSaved state of the virtual editor.
   * @returns The isSaved state of the virtual editor.
   */
  getIsSaved(): boolean {
    return this.isSaved;
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
    this.highlightStartCol = -1;
    this.currentlyHighlightedCode = "";
  }

  /**
   * Sets the current caret position of the virtual editor.
   * @param row The row to set the caret position to, referenced from (1, 1) being the top left of the editor.
   * @param column The column to set the caret position to, referenced from (1, 1) being the top left of the editor.
   */
  setCurrentCaretPosition(row: number, column: number) {
    this.caretRow = row - 1;
    this.caretCol = column - 1;
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

  /**
   * Returns an array of caret positions at each step.
   * @returns An array of caret positions at each step.
   */
  getAuthorActionsApplied(): Array<AuthorAction> {
    return this.authorActionsApplied;
  }

  /**
   * Gets the speech caption history.
   * @returns The speech caption history.
   */
  getSpeechCaptionHistory(): Array<ISpeechCaption> {
    return this.speechCaptionHistory;
  }

  /**
   * Gets the editor actions applied.
   * @returns The editor actions applied.
   */
  getEditorActionsApplied(): Array<EditorAction> {
    return this.editorActionsApplied;
  }

  /**
   * Gets the code after each step.
   * @returns The code after each step.
   */
  getCodeAfterEachStep(): Array<string> {
    return this.codeLinesHistory.map((codeLines) => codeLines.join("\n"));
  }

  /**
   * Gets the editor state after each step.
   * @returns The editor state after each step.
   */
  getEditorStateAfterEachStep(): Array<{
    code: string;
    caretPosition: IEditorPosition;
  }> {
    return this.codeLinesHistory.map((codeLines, index) => {
      return {
        code: codeLines.join("\n"),
        caretPosition: {
          row: this.caretPositionHistory[index].row,
          col: this.caretPositionHistory[index].col,
        },
      };
    });
  }

  /**
   * Gets the data for annotated frames.
   * @returns The data for annotated frames.
   */
  getDataForAnnotatedFrames(): Array<{
    actionApplied: IAction;
    code: string;
    highlightStartPosition: null | IEditorPosition;
    highlightedCode: string;
    caretPosition: IEditorPosition;
    speechCaptions: Array<ISpeechCaption>;
  }> {
    return this.actionsApplied.map((actionApplied, index) => {
      const speechCaptions = []
      if (isAuthorAction(actionApplied)) {
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
          col: this.highlightStartPositionHistory[index].col,
        } : null,
        highlightedCode: this.highlightHistory[index].join("\n"),
        caretPosition: {
          row: this.caretPositionHistory[index].row,
          col: this.caretPositionHistory[index].col,
        },
        speechCaptions,
      };
    });
  }

  /**
  * Sets the verbose mode for the virtual editor.
  * @param verbose Whether to enable verbose
  */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  // Helper function to calculate highlighted text
  private calculateHighlightedText(): string {
    if (this.highlightStartRow === -1) return "";

    if (this.caretRow === this.highlightStartRow) {
      // Single line highlight
      const start = Math.min(this.highlightStartCol, this.caretCol);
      const end = Math.max(this.highlightStartCol, this.caretCol);
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
        const startCol = isForwardSelection ? this.highlightStartCol : this.caretCol;
        highlightedLines.push(this.codeLines[row].substring(startCol));
      } else if (row === endRow) {
        // Last line - take from start of line to selection end
        const endCol = isForwardSelection ? this.caretCol : this.highlightStartCol;
        highlightedLines.push(this.codeLines[row].substring(0, endCol));
      } else {
        // Middle lines - take entire line
        highlightedLines.push(this.codeLines[row]);
      }
    }
    return highlightedLines.join('\n');
  }
}
