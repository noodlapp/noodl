import View from '../../../../../../shared/view';

export class TabGroup extends View {
  tabGroup: TSFixme;
  views: TSFixme[];
  tabs: TSFixme[];
  el: TSFixme;
  group: TSFixme;
  parent: TSFixme;

  constructor(args) {
    super();
    this.group = args.group;
    this.tabGroup = args.tabGroup;
    this.parent = args.parent;
    this.views = [];
    this.tabs = [];
  }
  render() {
    this.el = this.bindView(this.parent.cloneTemplate('tab-group'), this);

    this.tabs.forEach((tab, idx) => {
      const _el = this.bindView(this.parent.cloneTemplate('tab-group-tab'), { tab: tab });
      _el.find('.property-tab-icon').addClass(tab);
      _el.attr('data-tab', tab);
      this.$('.tabs').append(_el);
    });

    const selectedTab = this.parent._selectedTabForGroup[this.tabGroup] || this.tabs[0];
    this.$('.property-tab').removeClass('selected');
    this.$('[data-tab=' + selectedTab + ']').addClass('selected');

    this.views.forEach((v) => {
      v.render();
      this.$('.properties').append(v.el);

      if (v.port.tab.tab !== selectedTab) v.el.hide();
    });

    return this.el;
  }
  onTabClicked(scope, el, evt) {
    const selectedTab = (this.parent._selectedTabForGroup[this.tabGroup] = scope.tab);
    this.views.forEach((v) => {
      if (v.port.tab.tab !== selectedTab) v.el.hide();
      else v.el.show();
    });

    this.$('.property-tab').removeClass('selected');
    this.$('[data-tab=' + selectedTab + ']').addClass('selected');
  }
  addView(view) {
    this.views.push(view);
    if (this.tabs.indexOf(view.port.tab.tab) === -1) this.tabs.push(view.port.tab.tab);
  }
}
