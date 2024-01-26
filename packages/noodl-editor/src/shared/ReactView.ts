import React from 'react';
import ReactDOM from 'react-dom';
import View from './view';

export interface ReactViewDefaultProps {
  owner?: TSFixme;
}

export abstract class ReactView<TProps extends ReactViewDefaultProps> extends View {
  private props: TProps;

  public el: any;

  constructor(props: TProps) {
    super();

    this.props = props;
  }

  public set owner(owner: TSFixme) {
    this.props.owner = owner;
    this.render();
  }

  public render() {
    if (!this.el) {
      this.el = $(document.createElement('div'));
      this.el.css({
        width: '100%',
        height: '100%'
      });
    }

    ReactDOM.render(React.createElement(this.renderReact.bind(this), this.props), this.el[0]);

    return this.el;
  }

  public dispose() {
    this.el && ReactDOM.unmountComponentAtNode(this.el[0]);
  }

  protected abstract renderReact(props: TProps): JSX.Element;
}
