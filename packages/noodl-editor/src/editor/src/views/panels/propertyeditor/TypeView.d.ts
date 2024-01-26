import View from '../../../../../shared/view';

declare class TypeView extends View {
  port: TSFixme;
  displayName: TSFixme;
  name: TSFixme;
  type: TSFixme;
  group: TSFixme;
  parent: TSFixme;
  value: TSFixme;
  default: TSFixme;
  tooltip: TSFixme;
  isConnected: TSFixme;
  isDefault: TSFixme;

  dispose(): void;
  render(): TSFixme;
  getCurrentValue(name?: string): { value; isDefault };
  resetToDefault(): void;
  bindView(el: TSFixme, obj?: TSFixme): void;
}
