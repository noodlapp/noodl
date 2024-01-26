import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Based on: https://dev.to/pranomvignesh/restrict-editable-area-in-monaco-editor-4hac
 *
 * We need to have this for "CSS Style" to work on the nodes
 * since that is already scoped with a selector.
 *
 * So the CSS Style input would be something like this:
 * ```css
 *  [self] {
 *    // value...
 *  }
 * ```
 *
 * Then the highlight would work.
 */
export class PrefixSuffixExtension {
  private _editableArea: TSFixme;

  constructor(
    private readonly editor: monaco.editor.IStandaloneCodeEditor,
    private readonly model: monaco.editor.ITextModel,
    private readonly prefix: string,
    private readonly suffix: string
  ) {
    this._editableArea = PrefixSuffixExtension.createEditableArea(prefix, suffix);

    // Update the model
    model.setValue(`${this.prefix}${model.getValue()}${this.suffix}`);

    // Listen for change, and trigger undo when outside allowed range.
    this.model.onDidChangeContent(({ changes, isUndoing }) => {
      if (!isUndoing) {
        if (!this._editableArea.includes(changes, this.model)) {
          /*
           * This Promise.resolve() sends the code to the micro task queue
           * And it gets called before the event queue ( micro task queue has more priority than event queue)
           * Thus, Promise.resolve() will be better than a setTimeout(fn,0) here
           * If we do it synchronously, it affects some of monaco editor's functions
           */
          Promise.resolve().then(() => this.editor.trigger('block', 'undo', undefined));
        }
      }
    });
  }

  public getValue() {
    const fullRange = this.model.getFullModelRange();
    // @ts-ignore Typescript is acting strange
    const { range: startRange } = this.model.findMatches(this.prefix, fullRange).shift() || {};
    // @ts-ignore Typescript is acting strange
    const { range: endRange } = this.model.findMatches(this.suffix, fullRange).pop() || {};
    return this.model.getValueInRange(
      monaco.Range.fromPositions(startRange.getEndPosition(), endRange.getStartPosition())
    );
  }

  private static createEditableArea(startPhrase: string, endPhrase: string) {
    return {
      includes: function (changes: monaco.editor.IModelContentChange[], model: monaco.editor.ITextModel) {
        const fullRange = model.getFullModelRange();
        // @ts-ignore Typescript is acting strange
        let { range: startRange } = model.findMatches(startPhrase, fullRange).shift() || {};
        // @ts-ignore Typescript is acting strange
        let { range: endRange } = model.findMatches(endPhrase, fullRange).pop() || {};
        const { startLineNumber, endLineNumber, startColumn, endColumn } = fullRange;
        const isEmpty = (text: string) => text === ''; // ? refers to backspace and delete
        const isEnter = (text: string) => /\n/.test(text);
        if (startRange && endRange) {
          startRange = startRange.setStartPosition(startLineNumber, startColumn);
          endRange = endRange.setEndPosition(endLineNumber, endColumn);
          return changes.every(({ text, range }) => {
            const specialCases = () => {
              /*
               ? This is done for my use case
               ? This allows enter at the end of the start Range and 
               ? This allows the enter and backspace on the start of the end Range
               ? This is an optional case
               */
              return (
                (isEnter(text) || range.startLineNumber > startRange.endLineNumber) &&
                (isEnter(text) || isEmpty(text) || range.endLineNumber < endRange.startLineNumber)
              );
            };
            return !startRange.strictContainsRange(range) && !endRange.strictContainsRange(range) && specialCases();
          });
        }
        return false;
      }
    };
  }
}
