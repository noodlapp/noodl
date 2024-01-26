import React from 'react';

import { QueryEditPopup } from '../QueryEditPopup';
import { QueryPointerRule } from '../QueryPointerRule';
import { QueryRelationRule } from '../QueryRelationRule';
import { QueryRule } from '../QueryRule';
import { openPopup } from '../utils';

export interface QueryGroupProps {
  schema: TSFixme;
  query: TSFixme;

  isTopLevel?: TSFixme;

  onChange: TSFixme;
  onDeleteClicked?: TSFixme;
}

export class QueryGroup extends React.Component<QueryGroupProps> {
  childContainer: TSFixme;

  renderQueryRule(r) {
    const propertySchema = this.props.schema.properties[r.property];
    // Relation rules
    if (r.operator === 'related to')
      return (
        <QueryRelationRule
          onDelete={() => this.onDelete(r)}
          query={r}
          schema={this.props.schema}
          onChange={() => this.onChildChange()}
        />
      );
    // Pointer rules
    else if (propertySchema !== undefined && propertySchema.type === 'Pointer')
      return (
        <QueryPointerRule
          onDelete={() => this.onDelete(r)}
          query={r}
          schema={this.props.schema}
          onChange={() => this.onChildChange()}
        />
      );
    // Property rules
    else
      return (
        <QueryRule
          onDelete={() => this.onDelete(r)}
          query={r}
          schema={this.props.schema}
          onChange={() => this.onChildChange()}
        />
      );
  }

  renderChildren() {
    const q = this.props.query;
    return q.rules.map((r, idx) => (
      <div key={idx /* TODO: Invalid key */}>
        {r.combinator !== undefined ? (
          <QueryGroup
            onDeleteClicked={() => this.onDelete(r)}
            query={r}
            schema={this.props.schema}
            onChange={() => this.onChildChange()}
          />
        ) : (
          this.renderQueryRule(r)
        )}
        {idx !== q.rules.length - 1 ? <div className="queryeditor-combinator-label">{q.combinator}</div> : null}
      </div>
    ));
  }

  onDelete(rule) {
    const q = this.props.query;
    if (this.props.isTopLevel && q.rules.length === 1) return; // Don't delete last group on top level

    const idx = q.rules.indexOf(rule);
    if (idx !== -1) q.rules.splice(idx, 1);
    this.props.onChange && this.props.onChange();

    if (q.rules.length === 0) this.props.onDeleteClicked && this.props.onDeleteClicked();
    this.forceUpdate();
  }

  onChildChange() {
    this.props.onChange && this.props.onChange();
    this.forceUpdate();
  }

  onAddGroupClicked() {
    this.props.query.rules.push({
      combinator: 'and',
      rules: []
    });
    this.props.onChange && this.props.onChange();
    this.forceUpdate();
  }

  openEditPopupForRule(q, anchor) {
    openPopup({
      reactComponent: QueryEditPopup,
      props: {
        query: q,
        schema: this.props.schema
      },
      onChange: () => this.onChildChange(),
      onDelete: () => this.onDelete(q),
      attachTo: anchor
    });
  }

  onAddRuleClicked() {
    const rule = {};
    this.props.query.rules.push(rule);
    this.props.onChange && this.props.onChange();

    // This is a trick to automatically open the edit popup for the created rule
    setTimeout(() => {
      if (this.childContainer && this.childContainer.lastElementChild) {
        this.openEditPopupForRule(rule, this.childContainer.lastElementChild);
      }
    }, 100);
  }

  _isLastChildGroupsEmpty() {
    const q = this.props.query;
    const lastRule = q.rules[q.rules.length - 1];
    return lastRule.rules === undefined || lastRule.rules.length === 0;
  }

  render() {
    const q = this.props.query;
    return (
      <div
        className={'queryeditor-group' + (this.props.isTopLevel ? ' toplevel' : '')}
        style={{ position: 'relative' }}
      >
        <div className="queryeditor-group-children" ref={(el) => (this.childContainer = el)}>
          {this.renderChildren()}
        </div>
        <div className="queryeditor-group-row">
          {!this.props.isTopLevel && q.rules.length === 0 ? (
            <div className="queryeditor-add-filter-group-inner" onClick={() => this.onAddRuleClicked()}>
              <i className="fa fa-plus" style={{ marginRight: '10px' }}></i>Add filter rule
            </div>
          ) : null}
          {!this.props.isTopLevel && q.rules.length > 0 ? (
            <div
              className="queryeditor-add-rule"
              style={{ marginTop: q.rules.length > 0 ? '5px' : '0px' }}
              onClick={() => this.onAddRuleClicked()}
            >
              <div className="queryeditor-add-button">AND</div>
            </div>
          ) : null}
          {this.props.isTopLevel && !this._isLastChildGroupsEmpty() ? (
            <div
              className="queryeditor-add-group"
              style={{ marginTop: '5px' }}
              onClick={() => this.onAddGroupClicked()}
            >
              <div className="queryeditor-add-button">OR</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}
