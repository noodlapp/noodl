import { NodeLibrary } from '@noodl-models/nodelibrary';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import View from '../../../../../../shared/view';
import PopupLayer from '../../../popuplayer';
import { CodeEditorType } from '../CodeEditor';
import { ModelProxy } from '../models/modelProxy';
import { PagesType } from '../Pages';
import { getEditType } from '../utils';
import { AlignToolsType } from './AlignTools/AlignToolsType';
import { BasicType } from './BasicType';
import { BooleanType } from './BooleanType';
import { ColorType } from './ColorPicker/ColorType';
import { ComponentType } from './ComponentType';
import { CurveType } from './CurveEditor/CurveType';
import { Dimension } from './Dimension';
import { EnumType } from './EnumType';
import { SourceCodeType } from './FilePicker/SourceCodeType';
import { FontType } from './FontType';
import { IconType } from './IconType';
import { IdentifierType } from './IdentifierType';
import { ImageType } from './ImageType';
import { MarginPaddingType } from './MarginPaddingType';
import { NumberWithUnits } from './NumberWithUnits';
import { PopoutGroup } from './PopoutGroup';
import { PropListType } from './PropListType';
import { QueryFilterType } from './QueryFilterType';
import { QuerySortingType } from './QuerySortingType';
import { ResizingType } from './ResizingType';
import { SizeModeType } from './SizeModeType';
import { StringListType } from './StringList/StringListType';
import { TabGroup } from './TabGroup';
import { TextAreaType } from './TextAreaType';
import { TextStyleType } from './TextStyleType';
import { VariableType } from './VariableType';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PropertyEditorPortsTemplate = require('../../../../templates/propertyeditor/propertyeditorports.html');

const groupExpansions = {};

type Port = {
  popout?: TSFixme;
  group: string;
  name: string;
  displayName?: string;
  index?: number;
  plug?: string;
  type?: string;
};

export class Ports extends View {
  model: ModelProxy;
  popout: TSFixme;
  _selectedTabForGroup: TSFixme;
  activePopout: TSFixme;
  _portsHash: TSFixme;
  views: TSFixme;
  _toolsType: TSFixme;
  groups: TSFixme[];

  constructor(args) {
    super();
    this.model = args.model;
    this.popout = args.popout;
    this._selectedTabForGroup = {};

    this.bindModel(this.model);
  }
  showPopout(popout) {
    if (this.activePopout) {
      this.hidePopout();
    }

    const _onClose = popout.onClose;
    popout.onClose = () => {
      this.activePopout = null;
      _onClose && _onClose();
    };

    this.activePopout = PopupLayer.instance.showPopout(popout);
  }
  hidePopout() {
    PopupLayer.instance.hidePopout(this.activePopout);
  }
  bindModel(model) {
    model.on(
      [
        'instancePortsChanged',
        'portAdded',
        'portRemoved',
        'portRenamed',
        'connectionRemoved',
        'variantChanged',
        'variantUpdated'
      ],
      () => {
        this.renderGroups();
      },
      this
    );

    model.on(
      ['modelParameterUndo', 'modelParameterRedo'],
      () => {
        this._portsHash = undefined;
        this.renderGroups();
      },
      this
    );

    model.owner &&
      model.owner.on(
        ['connectionAdded', 'connectionRemoved'],
        () => {
          this.renderGroups();
        },
        this
      );
  }
  dispose() {
    this.model && this.model.off(this);
    // @ts-expect-error
    this.model && this.model.owner && this.model.owner.off(this);
    EventDispatcher.instance.off(this);

    this.views.forEach((v) => v.dispose && v.dispose());

    this.hidePopout();
  }
  renderParams(views, appendTo) {
    for (const j in views) {
      const v = views[j];
      v.childViews && v.childViews.forEach((v) => v.render()); // Render any child views first
      appendTo.append(v.render());
    }
  }
  onGroupClicked(group) {
    // group.isExpanded = !group.isExpanded;
    // groupExpansions[group.name] = group.isExpanded;
  }
  renderGroups() {
    const _this = this;

    const inputData = {
      ports: this._getPorts(),
      variant: this.model.variantName
    };

    const _portsHash = JSON.stringify(inputData);
    if (_portsHash === this._portsHash)
      // No change in ports, no need to re-render
      return;

    this._portsHash = _portsHash;

    //remember the scrolling so a re-render doesn't reset the scroll position
    let scrollTop = 0;
    if (this.el[0].parentElement) {
      scrollTop = this.el[0].parentElement.parentElement.scrollTop;
    }

    //this will reset any scrolling that might've occurred
    //let's set it back later when the the ports have rendered
    this.el.html('');

    const groups = this.getViewGroupsFromPorts();
    if (groups.length === 1 && groups[0].name === 'Other') {
      // If only one group then don't render group sections
      this.renderParams(groups[0].views, this.el);
    } else {
      // Render prop groups
      for (const i in groups) {
        const g = groups[i];
        if (groupExpansions.hasOwnProperty(g.name)) {
          g.isExpanded = groupExpansions[g.name];
        }

        const groupEl = this.bindView(this.cloneTemplate('group'), g);
        this.el.append(groupEl);

        this.renderParams(g.views, groupEl.find('.properties'));
      }
    }

    //and now the rendering is done. In case any scrolling was done, set the scrolling again
    if (scrollTop) {
      this.el[0].parentElement.parentElement.scrollTop = scrollTop;
    }

    this.$('input')
      .on('focus', function () {
        // Some element in the prop editor has gained focus
        // move to front
        _this.el.css({ 'z-index': '1000' });
      })
      .on('blur', function () {
        // Move back when blurred (wait 500ms)
        setTimeout(function () {
          _this.el.css({ 'z-index': '' });
        }, 500);
      });
  }
  render() {
    this._portsHash = undefined; // Clear cache
    this.el = this.bindView($(PropertyEditorPortsTemplate), this);
    this.renderGroups();
  }
  setParameterEx(name, newvalue, oldvalue, skipundo) {
    this.model.setParameter(name, newvalue, {
      undo: !skipundo,
      oldValue: oldvalue,
      label: 'edit parameter'
    });
  }
  setParameter(name, newvalue) {
    this.model.setParameter(name, newvalue, { undo: true, label: 'edit parameter' });
  }
  viewClassForPort(p) {
    const type = getEditType(p);

    // Align tools types
    function isOfAlignToolsType() {
      return NodeLibrary.nameForPortType(type) === 'enum' && typeof type === 'object' && type.alignComp !== undefined;
    }

    // Size mode types
    function isOfSizeModeType() {
      return NodeLibrary.nameForPortType(type) === 'enum' && typeof type === 'object' && type.sizeComp === 'mode';
    }

    // Enum types
    function isOfEnumType() {
      return NodeLibrary.nameForPortType(type) === 'enum' && typeof type === 'object' && type.enums;
    }

    // Color types
    function isOfColorType() {
      return NodeLibrary.nameForPortType(type) === 'color';
    }

    // Boolean types
    function isOfBooleanType() {
      return NodeLibrary.nameForPortType(type) === 'boolean';
    }

    // Basic types
    function isOfBasicType() {
      const name = NodeLibrary.nameForPortType(type);
      return name === 'string' || name === 'number';
    }

    // Is of text area type
    function isOfTextAreaType() {
      return NodeLibrary.nameForPortType(type) === 'string' && typeof type === 'object' && type.multiline;
    }

    // Is of code editor type
    function isOfCodeEditorType() {
      return NodeLibrary.nameForPortType(type) === 'string' && typeof type === 'object' && type.codeeditor;
    }

    function isOfArrayType() {
      return NodeLibrary.nameForPortType(type) === 'array';
    }

    // Image ref type
    function isOfImageType() {
      return NodeLibrary.nameForPortType(type) === 'image';
    }

    // Icon ref type
    function isOfIconType() {
      return NodeLibrary.nameForPortType(type) === 'icon';
    }

    // Font ref type
    function isOfFontType() {
      return NodeLibrary.nameForPortType(type) === 'font';
    }

    // Text style type
    function isOfTextStyleType() {
      return NodeLibrary.nameForPortType(type) === 'textStyle';
    }

    // Component reference type
    function isOfComponentType() {
      return NodeLibrary.nameForPortType(type) === 'component';
    }

    // Number with units
    function isOfNumberWithUnitsType() {
      return NodeLibrary.nameForPortType(type) === 'number' && type.units !== undefined;
    }

    // Dimension type (number, unit dropdown and special boolean for fixed dimension)
    function isOfDimensionType() {
      return NodeLibrary.nameForPortType(type) === 'dimension';
    }

    // Is source code file
    function isOfSourceCodeFileType() {
      return NodeLibrary.nameForPortType(type) === 'source';
    }

    // Is string list type
    function isOfStringListType() {
      return NodeLibrary.nameForPortType(type) === 'stringlist';
    }

    // Is margin padding type
    function isOfMarginPaddingType() {
      //  return NodeLibrary.nameForPortType(type) === 'margins' || NodeLibrary.nameForPortType(type) === 'padding';
      return type && type.marginPaddingComp !== undefined;
    }

    // Is of resizing type
    function isOfResizingType() {
      return NodeLibrary.nameForPortType(type) === 'resizing';
    }

    // Is of variable type
    function isOfVariableType() {
      return NodeLibrary.nameForPortType(type) === 'variable';
    }

    // Is of identifier
    function isOfIdentifierType() {
      return NodeLibrary.nameForPortType(type) === 'string' && typeof type === 'object' && type.identifierOf;
    }

    // Is of curve
    function isOfCurveType() {
      return NodeLibrary.nameForPortType(type) === 'curve';
    }

    // Is of query
    function isOfQueryFilterType() {
      return NodeLibrary.nameForPortType(type) === 'query-filter';
    }

    function isOfQuerySortingType() {
      return NodeLibrary.nameForPortType(type) === 'query-sorting';
    }

    // Is of pages type
    function isOfPagesType() {
      return NodeLibrary.nameForPortType(type) === 'pages';
    }

    // Is of proplist
    function isOfPropListType() {
      return NodeLibrary.nameForPortType(type) === 'proplist';
    }

    if (isOfAlignToolsType()) return AlignToolsType;
    else if (isOfSizeModeType()) return SizeModeType;
    else if (isOfEnumType()) return EnumType;
    else if (isOfColorType()) return ColorType;
    else if (isOfBooleanType()) return BooleanType;
    else if (isOfTextAreaType()) return TextAreaType;
    else if (isOfCodeEditorType()) return CodeEditorType;
    else if (isOfArrayType()) return CodeEditorType;
    else if (isOfMarginPaddingType()) return MarginPaddingType;
    else if (isOfNumberWithUnitsType()) return NumberWithUnits;
    else if (isOfDimensionType()) return Dimension;
    else if (isOfIdentifierType()) return IdentifierType;
    else if (isOfBasicType()) return BasicType;
    else if (isOfImageType()) return ImageType;
    else if (isOfIconType()) return IconType;
    else if (isOfFontType()) return FontType;
    else if (isOfTextStyleType()) return TextStyleType;
    else if (isOfComponentType()) return ComponentType;
    else if (isOfSourceCodeFileType()) return SourceCodeType;
    else if (isOfStringListType()) return StringListType;
    else if (isOfResizingType()) return ResizingType;
    else if (isOfVariableType()) return VariableType;
    else if (isOfCurveType()) return CurveType;
    else if (isOfQueryFilterType()) return QueryFilterType;
    else if (isOfQuerySortingType()) return QuerySortingType;
    else if (isOfPagesType()) return PagesType;
    else if (isOfPropListType()) return PropListType;
  }
  _getPorts(): readonly Port[] {
    let ports = this.model.getPorts('input');

    // Is type editable
    function isOfEditableType(p) {
      return !(typeof p.type === 'object' && p.type.allowConnectionsOnly);
    }

    // Remote not editable and ports that don't have an associated view
    ports = ports.filter((p) => isOfEditableType(p) && this.viewClassForPort(p) !== undefined);

    // If this is a popout remote all ports not beloning to this popout
    if (this.popout !== undefined)
      ports = ports.filter((p) => !(p.popout === undefined || p.popout.group !== this.popout));

    return ports;
  }

  getViewGroupsFromPorts() {
    const ports = this._getPorts();

    // Loop over all ports and create views
    this._toolsType = {};
    const _viewForPort = {};
    const _tabViews = {};
    const _popoutViews = {};
    this.views = [];

    let v: TSFixme;
    for (const i in ports) {
      const p = ports[i];

      if (p.popout !== undefined && this.popout === undefined) {
        // This port belongs to a popout
        if (_popoutViews[p.popout.group] === undefined) {
          _popoutViews[p.popout.group] = new PopoutGroup({
            group: p.popout.parentGroup || p.group,
            popoutGroup: p.popout.group,
            label: p.popout.label,
            parent: this
          });

          this.views.push(_popoutViews[p.popout.group]);
          _viewForPort[p.name] = v;
        }

        continue;
      }

      const viewClass = this.viewClassForPort(p);
      if (viewClass !== undefined) {
        v = viewClass.fromPort({ port: p, parent: this });
        if (v !== undefined) {
          this.views.push(v);
          _viewForPort[p.name] = v;
        }
      }
    }

    // Group property views
    const groups = (this.groups = []);

    function addToGroup(view) {
      const name = view.group ? view.group : 'Other';
      for (const i in groups) {
        const g = groups[i];
        if (g.name === name) {
          g.views.push(view);
          return;
        }
      }

      groups.push({ name: name, views: [view], isExpanded: true });
    }

    for (const i in this.views) {
      v = this.views[i];
      if (v.port !== undefined && v.port.parent !== undefined) {
        // This view port is a child to a parent port
        // add it to that view
        const parentV = _viewForPort[v.port.parent];
        parentV && parentV.addChildTypeView && parentV.addChildTypeView(v);
      } else if (v.port !== undefined && v.port.tab !== undefined) {
        // This port belongs to a tab group
        const group = v.port.tab.group;
        if (_tabViews[group] === undefined) {
          _tabViews[group] = new TabGroup({
            group: v.group,
            tabGroup: group,
            parent: this
          });
          addToGroup(_tabViews[group]);
        }
        _tabViews[group].addView(v);
      } else addToGroup(v);
    }

    return this.groups;
  }
}
