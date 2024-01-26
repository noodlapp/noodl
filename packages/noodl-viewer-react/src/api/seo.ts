const IS_BROWSER = typeof document !== 'undefined';

export class SeoApi {
  private _title = '';
  private _meta: Record<string, string> = {};

  /** Returns the current document title. */
  get title(): string {
    return IS_BROWSER ? document.title : this._title;
  }

  /** Set the document title. */
  setTitle(value: string) {
    this._title = value;

    if (IS_BROWSER) {
      document.title = value;
    }
  }

  /** Returns all the current meta-tags  */
  get meta(): Readonly<SeoApi['_meta']> {
    return this._meta;
  }

  /** Clear all the meta-tags. */
  clearMeta(): void {
    if (IS_BROWSER) {
      // Remove all the meta-tags, technically this is useless when running client-side.
      Object.keys(this._meta).forEach((key) => {
        const metaTag = document.querySelector(`meta[name="${key}"]`);
        if (metaTag) {
          metaTag.remove();
        }
      });
    }

    this._meta = {};
  }

  /** Returns a specific meta-tag by name. */
  getMeta(key: string) {
    // NOTE: We are not querying if the meta-tag exist, maybe something we would like to do?
    return this._meta[key];
  }

  /**
   * Set a meta-tag.
   *
   * @param key The 'name' and/or the 'property' key used for the meta-tags.
   * @param value The meta-tag content; if undefined, the meta-tag is removed.
   */
  setMeta(key: string, value: string | undefined): void {
    this._meta[key] = value;

    if (IS_BROWSER) {
      const metaTag = document.querySelector(`meta[name="${key}"]`);
      if (metaTag) {
        if (!value) {
          metaTag.remove();
        } else {
          metaTag.setAttribute('content', value);
        }
      } else if (value) {
        const newMetaTag = document.createElement('meta');
        newMetaTag.setAttribute('name', key);
        newMetaTag.setAttribute('property', key);
        newMetaTag.setAttribute('content', value);
        document.head.appendChild(newMetaTag);
      }
    }
  }
}
