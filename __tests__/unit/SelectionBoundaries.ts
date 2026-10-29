import { VirtualEditor } from '../../src/VirtualEditor';

const action = (name: string, value = '1') => ({ name, value });
const setup = () => new VirtualEditor(['  alpha', '', 'omega']);

describe('anchored logical-line selections', () => {
  it.each(['editor-command+shift+arrow-right', 'editor-shift+end'])('%s selects to end without the newline', name => {
    const editor = setup();
    editor.applyAction(action(name, '3'));
    expect(editor.getCurrentHighlightedCode()).toBe('  alpha');
    expect(editor.getCurrentHighlightCoordinates()).toEqual({ start: { row: 1, col: 1 }, end: { row: 1, col: 8 } });
    editor.applyAction(action('editor-shift+arrow-left', '2'));
    expect(editor.getCurrentHighlightedCode()).toBe('  alp');
  });

  it.each(['editor-command+shift+arrow-left', 'editor-shift+home'])('%s retains a backward anchor and replaces selection', name => {
    const editor = setup();
    editor.applyAction(action('editor-command-right'));
    editor.applyAction(action(name));
    expect(editor.getCurrentHighlightCoordinates()).toEqual({ start: { row: 1, col: 8 }, end: { row: 1, col: 1 } });
    editor.applyAction(action('editor-type', 'x'));
    expect(editor.getCode()).toBe('x\n\nomega');
  });

  it('selects characters across newlines, reverses across the anchor, and clamps at file bounds', () => {
    const editor = setup();
    editor.applyAction(action('editor-shift+arrow-right', '9'));
    expect(editor.getCurrentHighlightedCode()).toBe('  alpha\n\n');
    editor.applyAction(action('editor-shift+arrow-left', '20'));
    expect(editor.getCurrentCaretPosition()).toEqual({ row: 1, col: 1 });
    editor.applyAction(action('editor-arrow-right', '2'));
    editor.applyAction(action('editor-shift+arrow-left'));
    editor.applyAction(action('editor-shift+arrow-right', '3'));
    expect(editor.getCurrentHighlightCoordinates()).toEqual({ start: { row: 1, col: 3 }, end: { row: 1, col: 5 } });
  });

  it('handles up/down through empty lines and backward multiline replacement', () => {
    const editor = setup();
    editor.applyAction(action('editor-arrow-down', '2'));
    editor.applyAction(action('editor-command-right'));
    editor.applyAction(action('editor-shift+arrow-up', '2'));
    expect(editor.getCurrentHighlightedCode()).toBe('  alpha\n\nomega');
    editor.applyAction(action('editor-type', 'new'));
    expect(editor.getCode()).toBe('new');
  });

  it('consumes a selection with the first repeated backspace, then deletes normally', () => {
    const editor = setup();
    editor.applyAction(action('editor-command-right'));
    editor.applyAction(action('editor-shift+arrow-left', '2'));
    editor.applyAction(action('editor-backspace', '3'));
    expect(editor.getCode()).toBe('  a\n\nomega');
  });
});


it('keeps ordinary repeated arrows within the current logical line bounds', () => {
  const editor = new VirtualEditor(['abc', '', 'xyz']);
  editor.applyAction(action('editor-command-right'));
  editor.applyAction(action('editor-arrow-down', '2'));
  expect(editor.getCurrentCaretPosition()).toEqual({ row: 3, col: 1 });
  editor.applyAction(action('editor-arrow-left', '2'));
  expect(editor.getCurrentCaretPosition()).toEqual({ row: 1, col: 4 });
  editor.applyAction(action('editor-arrow-right', '5'));
  expect(editor.getCurrentCaretPosition()).toEqual({ row: 3, col: 4 });
  editor.applyAction(action('editor-shift+end'));
  editor.applyAction(action('editor-backspace'));
  expect(editor.getCode()).toBe('abc\n\nxy');
});
