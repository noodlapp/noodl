export default class View {
  el: JQuery<HTMLElement>;

  render(): TSFixme;

  static $(el, selector): JQuery<HTMLElement>;

  static showTooltip(args): void;
  static hideTooltip(args): void;

  $(selector): any;

  on(event: string, listener: (...args: TSFixme) => void, group?: any): View;
  off(group): View;
  notifyListeners(event, args?): void;

  cloneTemplate(tmpl): TSFixme;

  bindView(el, obj?): TSFixme;
}
