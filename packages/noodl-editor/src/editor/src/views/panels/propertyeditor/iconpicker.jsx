import React from 'react';
import { filesystem } from '@noodl/platform';

import { ProjectModel } from '@noodl-models/projectmodel';

import Tooltip from '../../../reactcomponents/tooltip';

// Styles
require('../../../styles/propertyeditor/iconpicker.css');

class IconPicker extends React.Component {
  constructor(props) {
    super(props);

    this.value = props.value || props.default;
    this.default = props.default;

    this.state = {
      iconSets: []
    };
  }

  componentDidMount() {
    // Look for icon modules
    IconPicker.LoadIconSets((iconSets) => {
      this.setState({
        iconSets: iconSets
      });
    });
  }

  componentWillUnmount() {}

  onIconClicked(iconSet, icon) {
    this.props.onIconSelected &&
      this.props.onIconSelected({
        codeAsClass: iconSet.codeAsClass,
        class: iconSet.iconClass,
        code: icon
      });
  }

  renderIconSet(set) {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          overflow: 'hidden',
          paddingLeft: '12px',
          paddingTop: '12px',
          paddingBottom: '12px'
        }}
      >
        {set.icons
          .filter((icon) => this.state.filter === undefined || icon.indexOf(this.state.filter) !== -1)
          .map((icon) => {
            let className = set.iconClass;
            let content = icon;

            if (set.codeAsClass) {
              className = [set.iconClass, icon].join(' ');
              content = undefined;
            }

            return (
              <span className="iconpicker-icon" onClick={(e) => this.onIconClicked(set, icon)}>
                <Tooltip text={icon}>
                  <span className={className} style={{ fontSize: '20px' }}>
                    {content}
                  </span>
                </Tooltip>
              </span>
            );
          })}
        {/* Add some space at the bottom to allow the Tooltip to expand */}
        <div style={{ width: '100%', height: '32px' }}></div>
      </div>
    );
  }

  renderIconSets() {
    return (
      <div style={{ overflowY: 'overlay' }}>
        {this.state.iconSets.map((set) => (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <div className="iconpicker-iconset-header" style={{ marginTop: '2px', marginBottom: '2px' }}>
              <span className="iconpicker-label">{set.name} </span>
            </div>
            <div>{this.renderIconSet(set)}</div>
          </div>
        ))}
      </div>
    );
  }

  onSearchChanged(ev) {
    this.setState({
      filter: ev.target.value.toLowerCase()
    });
  }

  render() {
    return (
      <div
        className="iconpicker-bg"
        style={{
          width: '470px',
          height: '370px',
          margin: '0px',
          padding: '0px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="iconpicker-header">
          <span className="iconpicker-label">Icon picker</span>
        </div>
        <div
          className="iconpicker-search-header"
          style={{ display: 'flex', paddingRight: '5px', paddingTop: '5px', paddingBottom: '3px' }}
        >
          <div style={{ flexGrow: 0, width: '35px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <i style={{ verticalAlign: 'middle', margin: '0 auto' }} className="fa fa-search search-icon" />
          </div>

          <input
            className="iconpicker-search-input"
            style={{ width: '100%', height: '26px' }}
            onChange={this.onSearchChanged.bind(this)}
          ></input>
        </div>

        {this.renderIconSets()}
      </div>
    );
  }
}

IconPicker.LoadIconSets = function (cb) {
  ProjectModel.instance.listModules((modules) => {
    var iconSets = [];
    modules.forEach((m) => {
      if (m.manifest !== undefined && m.manifest.type == 'iconset') {
        // Install font module if not already installed
        var exists = document.querySelector('#ndl-iconset-styles-0-' + m.name);
        if (!exists) {
          if (m.manifest.browser && m.manifest.browser.stylesheets) {
            m.manifest.browser.stylesheets.forEach((sheet, idx) => {
              if (typeof sheet === 'string') {
                const stylesheet = document.createElement('link');
                stylesheet.id = 'ndl-iconset-styles-' + idx + '-' + m.name;

                if (sheet.startsWith('http')) {
                  stylesheet.href = sheet;
                } else {
                  stylesheet.href = filesystem.join(ProjectModel.instance._retainedProjectDirectory, sheet);
                }

                stylesheet.rel = 'stylesheet';
                document.head.appendChild(stylesheet);
              }
            });
          }
        }

        iconSets.push({
          name: m.manifest.name,
          icons: m.manifest.icons,
          iconClass: m.manifest.iconClass,
          codeAsClass: m.manifest.codeAsClass || false
        });
      }
    });

    cb(iconSets);
  });
};

export default IconPicker;
