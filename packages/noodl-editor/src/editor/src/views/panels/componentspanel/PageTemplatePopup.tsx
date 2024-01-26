import React from 'react';

import { PrimaryButton, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Select } from '@noodl-core-ui/components/inputs/Select';
import { TextInput } from '@noodl-core-ui/components/inputs/TextInput';
import { Container } from '@noodl-core-ui/components/layout/Container';

type PageComponentTemplatePopupProps = {
  routers: string[];
  onCreate: (componentName: string, router: string) => void;
  onCancel: () => void;
};

type State = {
  router: string;
};

export class PageComponentTemplatePopup extends React.Component<PageComponentTemplatePopupProps, State> {
  componentName: string;

  constructor(props: PageComponentTemplatePopupProps) {
    super(props);

    this.state = {
      router: props.routers !== undefined ? props.routers[0] : undefined
    };
  }

  setComponentName(name: string) {
    this.componentName = name;
  }

  onAddClicked() {
    this.props.onCreate && this.props.onCreate(this.componentName, this.state.router);
  }

  onCancelClicked() {
    this.props.onCancel && this.props.onCancel();
  }

  render() {
    const hasRouters = this.props.routers !== undefined && this.props.routers.length > 1;
    const routers = this.props.routers?.map((router) => ({
      label: router,
      value: router
    }));

    return (
      <div
        style={{
          width: '300px',
          padding: '7px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* autoFocus doesn't work due to some timing issue, solve it manually with a short timer */}
        <TextInput
          label="New page name"
          onRefChange={(ref) => ref?.current && ref.current.focus()}
          onChange={(e) => this.setComponentName(e.target.value)}
          onEnter={() => this.onAddClicked()}
          hasBottomSpacing={hasRouters}
          value={this.componentName}
        />

        {hasRouters ? (
          <Select
            label="Choose router"
            value={this.state.router}
            options={routers}
            onChange={(r) => this.setState({ router: String(r) })}
          />
        ) : null}

        <Container hasTopSpacing>
          <PrimaryButton label="Add" hasRightSpacing onClick={() => this.onAddClicked()} />
          <PrimaryButton label="Cancel" variant={PrimaryButtonVariant.Muted} onClick={() => this.onCancelClicked()} />
        </Container>
      </div>
    );
  }
}
