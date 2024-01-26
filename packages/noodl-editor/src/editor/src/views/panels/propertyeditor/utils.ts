export function getEditType(p) {
  return p.type?.editAsType ? p.type.editAsType : p.type;
}
