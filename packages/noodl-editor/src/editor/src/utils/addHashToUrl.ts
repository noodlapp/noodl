export function addHashToUrl(url: string) {
  return `${url}?${new Date().getTime()}`;
}
