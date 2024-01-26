import { FileChange, getMediaType } from './status';

export enum DiffType {
  /** Changes to a text file, which may be partially selected for commit */
  Text,
  /** Changes to a file with a known extension, which can be viewed in the app */
  Image,
  /** Changes to an unknown file format, which Git is unable to present in a human-friendly format */
  Binary,
  /** Change to a repository which is included as a submodule of this repository */
  Submodule,
  /** Diff that will not be rendered */
  Unrenderable
}

export interface ITextDiff {
  readonly kind: DiffType.Text;
  readonly modified?: string;
  readonly original: string;
}

export class Image {
  public get dataSource(): string {
    return `data:${this.mediaType};base64,${this.contents}`;
  }

  /**
   * @param contents The base64 encoded contents of the image.
   * @param mediaType The data URI media type, so the browser can render the image correctly.
   * @param bytes Size of the file in bytes.
   */
  public constructor(
    public readonly contents: string,
    public readonly mediaType: string,
    public readonly bytes: number
  ) {}

  public static fromBinary(file: FileChange, buffer: Buffer) {
    return new Image(buffer.toString('base64'), getMediaType(file.extension), buffer.length);
  }
}

export interface IImageDiff {
  readonly kind: DiffType.Image;
  readonly modified?: Image;
  readonly original: Image;
}

export interface IBinaryDiff {
  readonly kind: DiffType.Binary;
}

export interface IUnrenderableDiff {
  readonly kind: DiffType.Unrenderable;
}

/** The union of diff types */
export type IDiff = ITextDiff | IImageDiff | IBinaryDiff | IUnrenderableDiff;
