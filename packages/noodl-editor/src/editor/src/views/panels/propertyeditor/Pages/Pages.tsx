import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';

import { RouterAdapter } from '../../../../models/NodeTypeAdapters/RouterAdapter';
import { ProjectModel } from '../../../../models/projectmodel';
import PopupLayer from '../../../popuplayer';
import * as NewPopupLayer from '../../../PopupLayer/index';
import { ToastLayer } from '../../../ToastLayer/ToastLayer';

// Styles
require('../../../../styles/propertyeditor/pages.css');

function CreateNewPage(props) {
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef(null);

  const onCreateNewPage = () => {
    const name = inputRef.current.value;

    if (!name) return;

    props.onCreateNewPage(name);
  };

  if (isCreating) {
    return (
      <>
        <div className="variants-header">
          <span>New page name</span>
        </div>
        <div className="variants-input-container">
          <input
            autoFocus
            className="variants-input"
            ref={inputRef}
            onKeyUp={(e) => e.key === 'Enter' && onCreateNewPage()}
          />
          <button className="variants-button primary" onClick={onCreateNewPage}>
            Create
          </button>
        </div>
      </>
    );
  } else {
    return (
      <div className="variants-header variants-add-header">
        <span>Create new page</span>
        <IconButton
          icon={IconName.Plus}
          size={IconSize.Small}
          UNSAFE_className="add-button"
          variant={IconButtonVariant.OpaqueOnHover}
          onClick={() => setIsCreating(true)}
        />
      </div>
    );
  }
}

function PageItem(props) {
  return (
    <div className="variants-pick-variant-item is-page" onClick={props.onSelectClicked}>
      <div className="variants-pick-variant-inner">
        <div className="router-pages-icon" style={{ margin: '0px', marginLeft: '7px' }}></div>
        <div className="variant-item-name" style={{ marginRight: '7px' }}>
          {props.name}
        </div>
      </div>
    </div>
  );
}

function AddNewPagePopup(props) {
  return (
    <div style={{ width: '230px', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflow: 'hidden auto', flexGrow: 1 }}>
        <CreateNewPage onCreateNewPage={props.onCreateNewPage} />

        {props.pages.map((p) => (
          <PageItem
            name={p.title || p.component}
            key={p.title || p.component}
            onSelectClicked={() => props.onPageSelected(p)}
          ></PageItem>
        ))}
      </div>
    </div>
  );
}

function BigPageItem(props) {
  const popupAnchor = useRef(null);

  const p = props.page;

  return (
    <div style={{ display: 'flex' }}>
      <div className="router-pages-page" onClick={props.onPageClicked}>
        <div style={{ display: 'flex' }}>
          <div className={'router-pages-icon' + (props.isStartPage ? ' start-page' : '')}></div>
        </div>
        <div style={{ flexGrow: 1 }}>
          <div className="router-pages-component">{p.title || p.component}</div>
          <div className="router-pages-path">{p.path}</div>
        </div>
        <div style={{ display: 'flex' }}>
          <div
            className="router-pages-actions-icon"
            ref={popupAnchor}
            onClick={(evt) => props.onPageActionsClicked(popupAnchor.current, evt)}
          >
            <i className="fa fa-ellipsis-h"></i>
          </div>
        </div>
      </div>
    </div>
  );
}

export class Pages extends React.Component {
  constructor(props) {
    super(props);

    // @ts-expect-error
    this.value = this.props.value || {};
    // @ts-expect-error
    const pages = RouterAdapter.getPageInfoForComponents(this.value.routes || []);

    this.state = {
      pages: pages
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onPageClicked(p) {
    // @ts-expect-error
    this.props.onPageClicked && this.props.onPageClicked(p);
  }

  removePage(p) {
    // @ts-expect-error
    if (this.value === undefined || this.value.routes === undefined) return;

    // @ts-expect-error
    const idx = this.value.routes.indexOf(p.component);
    if (idx !== -1) {
      // @ts-expect-error
      this.value.routes.splice(idx, 1);
      // @ts-expect-error
      if (this.value.startPage === p.component) this.value.startPage = undefined;

      this.setState({
        // @ts-expect-error
        pages: RouterAdapter.getPageInfoForComponents(this.value.routes)
      });
      // @ts-expect-error
      this.props.onChange && this.props.onChange(this.value);
    }
  }

  setAsStartPage(p) {
    // @ts-expect-error
    this.value.startPage = p.component;
    this.setState({});
    // @ts-expect-error
    this.props.onChange && this.props.onChange(this.value);
  }

  onAddNewPageClicked() {
    // Get page components
    // Filter out pages already in the router
    const pages = RouterAdapter.getPageComponents().filter(
      // @ts-expect-error
      (p) => this.value.routes == undefined || this.value.routes.indexOf(p) === -1
    );

    const props = {
      pages: RouterAdapter.getPageInfoForComponents(pages),
      onCreateNewPage: (name) => {
        if (name === undefined || name === '') {
          ToastLayer.showError('Component name cannot be empty');
          return;
        }

        // Place component in current folder
        const c = NodeGraphContextTmp.nodeGraph.getActiveComponent();
        const nameParts = c.fullName.split('/');
        nameParts.pop();

        const fullName = nameParts.join('/') + '/' + name;
        if (ProjectModel.instance.getComponentWithName(fullName)) {
          ToastLayer.showError('A component with that name already exists');
          return;
        }

        // Create the component
        const pageComponent = RouterAdapter.createPageComponent(fullName);

        ProjectModel.instance.addComponent(pageComponent, { undo: true, label: 'page created' });

        // @ts-expect-error
        if (this.value.routes === undefined) this.value.routes = [];
        // @ts-expect-error
        this.value.routes.push(fullName);
        this.setState({
          // @ts-expect-error
          pages: RouterAdapter.getPageInfoForComponents(this.value.routes)
        });
        // @ts-expect-error
        this.props.onChange && this.props.onChange(this.value);

        PopupLayer.instance.hidePopup();
      },
      onPageSelected: (page) => {
        // @ts-expect-error
        if (this.value.routes === undefined) this.value.routes = [];
        // @ts-expect-error
        this.value.routes.push(page.component);
        this.setState({
          // @ts-expect-error
          pages: RouterAdapter.getPageInfoForComponents(this.value.routes)
        });
        // @ts-expect-error
        this.props.onChange && this.props.onChange(this.value);

        PopupLayer.instance.hidePopup();
      }
    };
    const div = document.createElement('div');
    ReactDOM.render(React.createElement(AddNewPagePopup, props), div);

    PopupLayer.instance.showPopup({
      content: { el: $(div) },
      // @ts-expect-error
      attachTo: $(this.popupAnchor),
      position: 'right',
      onClose: function () {}
    });
  }

  onPageActionsClicked(page, popupAnchor, evt) {
    const menu = new NewPopupLayer.PopupMenu({
      items: [
        {
          icon: IconName.Home,
          label: 'Make start page',
          onClick: () => {
            this.setAsStartPage(page);
          }
        },
        {
          icon: IconName.Trash,
          label: 'Remove page',
          onClick: () => {
            this.removePage(page);
          }
        }
      ]
    });
    menu.render();

    PopupLayer.instance.showPopup({
      content: menu,
      attachTo: $(popupAnchor),
      position: 'bottom',
      onOpen: function () {
        //   el.removeClass('sidebar-panel-item-show-on-hover');
      },
      onClose: function () {
        //   el.addClass('sidebar-panel-item-show-on-hover');
      }
    });

    evt.stopPropagation();
  }

  render() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {
          // @ts-expect-error
          this.state.pages !== undefined
            ? // @ts-expect-error
              this.state.pages.map((p) => (
                <BigPageItem
                  // @ts-expect-error
                  isStartPage={p.component === this.value.startPage}
                  page={p}
                  key={p.component || p.title}
                  onPageClicked={this.onPageClicked.bind(this, p)}
                  onPageActionsClicked={this.onPageActionsClicked.bind(this, p)}
                />
              ))
            : null
        }
        <div
          className="sidebar-fullwidth-button"
          onClick={(e) => {
            e.stopPropagation();
            this.onAddNewPageClicked();
          }}
          // @ts-expect-error
          ref={(el) => (this.popupAnchor = el)}
        >
          <i className="fa fa-plus" style={{ marginRight: '5px' }}></i>Add new page
        </div>
      </div>
    );
  }
}
