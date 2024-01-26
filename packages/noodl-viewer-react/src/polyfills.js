export default function registerPolyfills() {
  if (!String.prototype.matchAll) {
    //old iPads and browsers (~2018 or earlier)
    String.prototype.matchAll = function matchAll(pattern) {
      var regex = new RegExp(pattern, 'g');
      var matches = [];

      var match_result = this.match(regex);

      for (let index in match_result) {
        var item = match_result[index];
        matches[index] = item.match(new RegExp(pattern));
      }
      return matches;
    };
  }
}
