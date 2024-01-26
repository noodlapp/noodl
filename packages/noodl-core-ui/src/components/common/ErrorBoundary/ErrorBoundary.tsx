import React from 'react';

import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Slot } from '@noodl-core-ui/types/global';

import css from './ErrorBoundary.module.scss';

export interface ErrorBoundaryProps {
  showTryAgain?: boolean;
  onTryAgain?: () => void;

  hideErrorStack?: boolean;
  hideCopyError?: boolean;

  children: Slot;
}

// https://reactjs.org/docs/error-boundaries.html
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  {
    error: any;
    errorInfo: any;
    showMore: boolean;
  }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
      showMore: false
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // You can also log error messages to an error reporting service here
  }

  render() {
    if (this.state.errorInfo) {
      const onCopyError = () => {
        navigator.clipboard.writeText(
          JSON.stringify({
            // TODO: Add Noodl version etc
            error: this.state.error?.toString(),
            stack: this.state.errorInfo.componentStack
          })
        );
        // TODO: Add some user feedback, this component should probably be in the editor
      };

      // Error path
      return (
        <div className={css['Root']}>
          <div className={css['Center']}>
            <Box hasXSpacing UNSAFE_style={{ width: '100%', boxSizing: 'border-box' }}>
              <Label size={LabelSize.Big} hasBottomSpacing>
                Aw, Snap!
              </Label>
              <Text>Something happened.</Text>
              {this.props.showTryAgain && (
                <Box hasTopSpacing>
                  <HStack hasSpacing>
                    <Box>
                      <PrimaryButton
                        size={PrimaryButtonSize.Small}
                        label="Click here to try again"
                        onClick={this.props.onTryAgain}
                      />
                    </Box>
                  </HStack>
                </Box>
              )}
            </Box>
          </div>

          {this.props.hideCopyError !== true && (
            <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
              <div style={{ background: 'var(--theme-color-bg-2)', borderTop: '1px solid var(--theme-color-bg-1)' }}>
                <div className={css['Container']}>
                  <Collapsible isCollapsed={!this.state.showMore}>
                    <pre>
                      <span className={css['Error']}>{this.state.error && this.state.error.toString()}</span>
                      <span>{this.state.errorInfo.componentStack}</span>
                    </pre>
                  </Collapsible>
                </div>
              </div>

              <div className={css['Container']}>
                <HStack hasSpacing>
                  {this.props.hideErrorStack !== true && (
                    <Box>
                      <PrimaryButton
                        variant={PrimaryButtonVariant.Muted}
                        size={PrimaryButtonSize.Small}
                        label="More info"
                        onClick={() =>
                          this.setState((prev) => ({
                            showMore: !prev.showMore
                          }))
                        }
                        hasBottomSpacing
                      />
                    </Box>
                  )}
                  <Box>
                    <PrimaryButton
                      variant={PrimaryButtonVariant.Ghost}
                      size={PrimaryButtonSize.Small}
                      label="Copy Error Message"
                      onClick={onCopyError}
                    />
                  </Box>
                </HStack>
              </div>
            </div>
          )}
        </div>
      );
    }
    // Normally, just render children
    return this.props.children;
  }
}
