import React from 'react';

import { QuerySortingRule } from '../QuerySortingRule';
import { QuerySortingRuleEditPopup } from '../QuerySortingRuleEditPopup';
import { openPopup } from '../utils';

export interface QuerySortingEditorProps {
  schema: TSFixme;
  sorting: TSFixme;

  onChange: (value: TSFixme) => void;
}

export class QuerySortingEditor extends React.Component<QuerySortingEditorProps> {
  sorting: TSFixme;
  childContainer: TSFixme;

  constructor(props) {
    super(props);

    if (props.sorting !== undefined) this.sorting = JSON.parse(JSON.stringify(props.sorting));
  }

  onChange() {
    this.props.onChange(this.sorting);
    this.forceUpdate();
  }

  onDelete(s) {
    const idx = this.sorting.indexOf(s);
    if (idx !== -1) {
      this.sorting.splice(idx, 1);
      if (this.sorting.length === 0) this.sorting = undefined;

      this.onChange();
    }
  }

  onAddRuleClicked() {
    if (this.sorting === undefined) this.sorting = [];

    const rule = {};
    this.sorting.push(rule);
    this.onChange();

    // This is a trick to automatically open the edit popup for the created rule
    setTimeout(() => {
      if (this.childContainer && this.childContainer.lastElementChild) {
        this.openEditPopupForRule(rule, this.childContainer.lastElementChild);
      }
    }, 100);
  }

  openEditPopupForRule(r, anchor) {
    openPopup({
      reactComponent: QuerySortingRuleEditPopup,
      props: {
        rule: r,
        schema: this.props.schema
      },
      onChange: () => this.onChange(),
      onDelete: () => this.onDelete(r),
      attachTo: anchor
    });
  }

  render() {
    return (
      <div>
        {this.sorting === undefined ? (
          <div className="queryeditor-add-filter-group">
            <div className="queryeditor-add-filter-group-inner" onClick={() => this.onAddRuleClicked()}>
              <i className="fa fa-plus" style={{ marginRight: '10px' }}></i>Add sorting rule
            </div>
          </div>
        ) : null}
        {this.sorting !== undefined ? (
          <div>
            <div className="queryeditor-sorting-rules">
              <div ref={(el) => (this.childContainer = el)}>
                {this.sorting.map((s, idx) => (
                  <div key={idx /* TODO: Invalid key */}>
                    <QuerySortingRule
                      rule={s}
                      schema={this.props.schema}
                      onChange={() => this.onChange()}
                      onDelete={() => this.onDelete(s)}
                    />
                    {idx !== this.sorting.length - 1 ? <div className="queryeditor-combinator-label">then</div> : null}
                  </div>
                ))}
              </div>
              <div
                className="queryeditor-add-rule"
                style={{ marginTop: this.sorting.length > 0 ? '5px' : '0px' }}
                onClick={() => this.onAddRuleClicked()}
              >
                <div className="queryeditor-add-button">THEN</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
