import async from 'async';
import { Remarkable } from 'remarkable';

import getDocsEndpoint from '@noodl-utils/getDocsEndpoint';

// Fetch and parse out documentation for inputs and outputs
const _pages = {};

class DocsParser {
  baseUrl: URL;
  md: Remarkable;

  constructor() {
    this.md = new Remarkable({
      html: true,
      breaks: true
    });
  }

  getDocsForType(type, cb) {
    let docsUrl = type.docs.replace('#/', ''); // + '-short.md';

    if (!docsUrl.endsWith('.md')) docsUrl = docsUrl += '.md';

    // Update no version tag with version tag (and potentially switch to local docs)
    docsUrl = docsUrl.replace('https://docs.noodl.net', getDocsEndpoint());

    if (docsUrl.includes('localhost:3000') === false) {
      // See if the page is in the cache
      if (_pages[docsUrl] !== undefined) return cb(_pages[docsUrl]);
    }

    this.fetchPage(docsUrl, (md) => {
      if (!md) return;

      const page = {
        inputs: {},
        outputs: {}
      };

      // Find all input and output references
      const inputMatches = md.matchAll(/{\*\/##input:([A-Za-z0-9\s\.\*\-]+)##\*\\}(.*?){\*\/##input##\*\\}/g);
      for (const _s of inputMatches) {
        const inputName = _s[1];
        if (inputName === undefined) continue;

        const docs = _s[2];
        page.inputs[inputName] = this.md.render(docs);
      }

      const outputMatches = md.matchAll(/{\*\/##output:([A-Za-z0-9\s\.\*\-]+)##\*\\}(.*?){\*\/##output##\*\\}/g);
      for (const _s of outputMatches) {
        const outputName = _s[1];
        if (outputName === undefined) continue;

        const docs = _s[2];
        page.outputs[outputName] = this.md.render(docs);
      }

      _pages[docsUrl] = page;
      cb(page);
    });
  }

  fetchPage(url: string, callback) {
    this.baseUrl = new URL(url);

    $.ajax({
      url: url,
      headers: {
        Accept: 'text/html'
      },
      success: function (md) {
        // Find all filename references
        const matches = md.matchAll(/\[filename\]\((.*?)\'\:include\'\)/g);
        const refs = [];
        for (const m of matches) {
          let ref = m[1];
          if (ref !== undefined) {
            ref = ref.trim();

            const absoluteUrl = new URL(ref, url);
            refs.push({ anchor: m[0], url: absoluteUrl.href });
          }
        }

        async.each(
          refs,
          function (ref, cb) {
            $.ajax({
              url: ref.url,
              headers: {
                Accept: 'text/html'
              },
              success: function (refMd) {
                md = md.replace(ref.anchor, refMd);
                cb();
              },
              error: function () {
                cb(); // Ignore error
              }
            });
          },
          function () {
            // All done
            callback(md);
          }
        );
      },
      error: function (err) {
        if (err.status === 401) {
          /* Access denied */
        } else {
          console.warn(err);
          callback();
        }
      }
    });
  }
}

const docsParser = new DocsParser();
export { docsParser };
