export function getMatchIndex(targetName: string, searchTerm: string) {
  return targetName.toLowerCase().indexOf(searchTerm.toLowerCase());
}

export function arrayIntersection(array1, array2) {
  return [...new Set(array1.filter((value) => array2.includes(value)))];
}
