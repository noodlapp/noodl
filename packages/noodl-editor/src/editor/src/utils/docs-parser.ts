import async from 'async';
import highlight from 'highlight.js';
import { Remarkable } from 'remarkable';

const getDocsEndpoint = require('../utils/getDocsEndpoint').default;

export class DocsParser {
  baseUrl: URL;

  dispose() {}

  parsePage(content: string, _options: TSFixme) {
    const _this = this;
    const endpoint = getDocsEndpoint();

    const md = new Remarkable({
      html: true,
      breaks: true,
      highlight: function (code) {
        return highlight.highlightAuto(code, ['javascript']).value;
      }
    });

    const regexMatch = content.match(/{\/\*##head##\*\/}([\s\S]*?){\/\*##head##\*\/}/);
    if (!regexMatch) return null;

    const el = $('<div>' + md.render(regexMatch[1]) + '</div>');

    // Iterate over all images and load the src as a dataurl
    el.find('img').each(function () {
      const _el = $(this);
      const url = _el.attr('src');

      if (!url.startsWith('/')) {
        _el.attr('src', _this.baseUrl.href.split('/').slice(0, -1).join('/') + '/' + url);
      } else {
        _el.attr('src', endpoint + url);
      }
    });

    el.find('a').each(function () {
      const _el = $(this);
      _el.attr('target', '_blank'); // Open external

      let url = _el.attr('href');

      if (url.startsWith('https://docs.noodl.net')) {
        //add version number
        url.replace('https://docs.noodl.net', endpoint);
      } else {
        url = endpoint + url;
      }
      _el.attr('href', url);
    });

    return el[0];
  }

  fetchPage(url: string, callback) {
    const _this = this;

    this.baseUrl = new URL(url);

    $.ajax({
      url: url,
      headers: {
        Accept: 'text/html'
      },
      success: function (html) {
        // Find all filename references
        const matches = html.matchAll(/@include\s\"(.*)\"/g);
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
              success: function (refHtml) {
                html = html.replace(ref.anchor, refHtml);
                cb();
              },
              error: function () {
                cb(); // Ignore error
              }
            });
          },
          function () {
            // All done
            callback(_this.parsePage(html, {}));
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
