import React from 'react';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { ScrollArea } from '@noodl-core-ui/components/layout/ScrollArea';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { PropertyPanelButton } from '@noodl-core-ui/components/property-panel/PropertyPanelButton';
import { PropertyPanelCheckbox } from '@noodl-core-ui/components/property-panel/PropertyPanelCheckbox';
import {
  PropertyPanelIconRadioInput,
  PropertyPanelIconRadioSize
} from '@noodl-core-ui/components/property-panel/PropertyPanelIconRadioInput';
import {
  PropertyPanelInput,
  PropertyPanelInputType,
  PropertyPanelRow
} from '@noodl-core-ui/components/property-panel/PropertyPanelInput';
import { PropertyPanelLengthUnitInput } from '@noodl-core-ui/components/property-panel/PropertyPanelLengthUnitInput';
import { PropertyPanelMarginPadding } from '@noodl-core-ui/components/property-panel/PropertyPanelMarginPadding';
import { PropertyPanelNumberInput } from '@noodl-core-ui/components/property-panel/PropertyPanelNumberInput';
import { PropertyPanelSelectInput } from '@noodl-core-ui/components/property-panel/PropertyPanelSelectInput';
import { PropertyPanelSliderInput } from '@noodl-core-ui/components/property-panel/PropertyPanelSliderInput';
import { PropertyPanelTextInput } from '@noodl-core-ui/components/property-panel/PropertyPanelTextInput';
import { PropertyPanelTextRadioInput } from '@noodl-core-ui/components/property-panel/PropertyPanelTextRadioInput';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { CollapsableSection } from '@noodl-core-ui/components/sidebar/CollapsableSection';
import { PanelHeader } from '@noodl-core-ui/components/sidebar/PanelHeader';
import { DefaultApp } from '@noodl-core-ui/preview/template/DefaultApp';

export function Group() {
  return <DefaultApp panel={<GroupPanel />} />;
}

function GroupPanel() {
  return (
    <BasePanel isFill>
      <PanelHeader title="Group" />

      <ScrollArea>
        <VStack>
          <CollapsableSection title="Margin and padding">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelMarginPadding
                values={{
                  padding: { top: '10px', bottom: '10px', left: '10px', right: '10px' },
                  margin: { top: '10px', bottom: '10px', left: '10px', right: '10px' }
                }}
              />
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Alignment">
            <Box hasXSpacing>
              <PropertyPanelRow isChanged={false} label="Horizontal">
                <PropertyPanelIconRadioInput
                  value="left"
                  properties={{
                    name: '',
                    options: [
                      {
                        icon: <Icon icon={IconName.AlignItemLeft} />,
                        value: 'left'
                      },
                      {
                        icon: <Icon icon={IconName.AlignItemCenter} />,
                        value: 'center'
                      },
                      {
                        icon: <Icon icon={IconName.AlignItemRight} />,
                        value: 'right'
                      }
                    ]
                  }}
                />
              </PropertyPanelRow>
            </Box>

            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow isChanged={false} label="Vertical">
                <PropertyPanelIconRadioInput
                  value="flex-end"
                  properties={{
                    name: '',
                    options: [
                      {
                        icon: <Icon icon={IconName.JustifyContentEnd} />,
                        value: 'flex-end'
                      },
                      {
                        icon: <Icon icon={IconName.JustifyContentCenter} />,
                        value: 'center'
                      },
                      {
                        icon: <Icon icon={IconName.JustifyContentStart} />,
                        value: 'flex-start'
                      }
                    ]
                  }}
                />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Dimensions">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelInput
                label="Size mode"
                inputType={PropertyPanelInputType.IconRadio}
                value="flex-end"
                properties={{
                  name: '',
                  options: [
                    {
                      icon: <Icon icon={IconName.DimensionWidthHeight} size={IconSize.Large} />,
                      value: 'flex-end'
                    },
                    {
                      icon: <Icon icon={IconName.DimenstionWidth} size={IconSize.Large} />,
                      value: 'center'
                    },
                    {
                      icon: <Icon icon={IconName.DimensionHeight} size={IconSize.Large} />,
                      value: 'flex-start'
                    },
                    {
                      icon: <Icon icon={IconName.Dimension} size={IconSize.Large} />,
                      value: 'flex-start'
                    }
                  ]
                }}
              />
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Layout">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Position" isChanged={false}>
                <PropertyPanelSelectInput
                  properties={{
                    options: [{ label: 'In Layout', value: 'normal' }]
                  }}
                  value="normal"
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="Direction" isChanged={false}>
                <PropertyPanelTextRadioInput
                  onChange={() => {}}
                  value={'normal'}
                  properties={{
                    name: 'layout-direction',
                    options: [
                      { label: 'Vertical', value: 'normal' },
                      { label: 'Horizontal', value: 'horizontal' }
                    ]
                  }}
                />
              </PropertyPanelRow>

              <PropertyPanelInput
                label="Multi Line Wrap"
                inputType={PropertyPanelInputType.TextRadio}
                value="normal"
                properties={{
                  options: [
                    { label: 'Off', value: 'normal' },
                    { label: 'On', value: 'on' },
                    { label: 'Reverse', value: 'reverse' }
                  ]
                }}
              />

              <PropertyPanelRow label="Vertical Gap" isChanged={false}>
                <PropertyPanelLengthUnitInput value="0px" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Clip Content" isChanged={false}>
                <PropertyPanelCheckbox value={false} />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Align and justify content">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelIconRadioInput
                value="left"
                properties={{
                  name: '',
                  options: [
                    {
                      icon: <Icon icon={IconName.AlignItemLeft} />,
                      value: 'left'
                    },
                    {
                      icon: <Icon icon={IconName.AlignItemCenter} />,
                      value: 'center'
                    },
                    {
                      icon: <Icon icon={IconName.AlignItemRight} />,
                      value: 'right'
                    }
                  ]
                }}
              />
            </Box>
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelIconRadioInput
                value="flex-end"
                properties={{
                  name: '',
                  options: [
                    {
                      icon: <Icon icon={IconName.JustifyContentEnd} />,
                      value: 'flex-end'
                    },
                    {
                      icon: <Icon icon={IconName.JustifyContentCenter} />,
                      value: 'center'
                    },
                    {
                      icon: <Icon icon={IconName.JustifyContentStart} />,
                      value: 'flex-start'
                    },
                    {
                      icon: <Icon icon={IconName.JustifyContentSpaceBetween} />,
                      value: 'flex-start'
                    },
                    {
                      icon: <Icon icon={IconName.JustifyContentSpaceAround} />,
                      value: 'flex-start'
                    },
                    {
                      icon: <Icon icon={IconName.JustifyContentSpaceEvenly} />,
                      value: 'flex-start'
                    }
                  ]
                }}
              />
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Scroll">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Enable Scroll" isChanged={false}>
                <PropertyPanelCheckbox value={false} />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Style">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Opacity" isChanged={false}>
                <PropertyPanelSliderInput value={1} properties={{ min: 0, max: 1 }} />
              </PropertyPanelRow>
              <PropertyPanelRow label="Blend Mode" isChanged={false}>
                <PropertyPanelSelectInput
                  properties={{
                    options: [{ label: 'Normal', value: 'normal' }]
                  }}
                  value="normal"
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="Background Color" isChanged={false}>
                {/* TODO: Color */}
                <PropertyPanelLengthUnitInput value="0px" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Visible" isChanged={false}>
                <PropertyPanelCheckbox value={true} />
              </PropertyPanelRow>
              <PropertyPanelRow label="zIndex" isChanged={false}>
                <PropertyPanelNumberInput value="" />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Border Style">
            <Box hasXSpacing>
              <PropertyPanelInput
                label="Editing border"
                inputType={PropertyPanelInputType.IconRadio}
                value="left"
                properties={{
                  name: '',
                  options: [
                    {
                      icon: <Icon icon={IconName.BorderAll} />,
                      value: 'left'
                    },
                    {
                      icon: <Icon icon={IconName.BorderLeft} />,
                      value: 'center'
                    },
                    {
                      icon: <Icon icon={IconName.BorderUp} />,
                      value: 'right'
                    },
                    {
                      icon: <Icon icon={IconName.BorderRight} />,
                      value: 'right'
                    },
                    {
                      icon: <Icon icon={IconName.BorderDown} />,
                      value: 'right'
                    }
                  ]
                }}
              />
            </Box>
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Border Style" isChanged={false}>
                <PropertyPanelSelectInput
                  properties={{
                    options: [
                      { label: 'None', value: 'none' },
                      { label: 'Solid', value: 'solid' },
                      { label: 'Dotted', value: 'dotted' },
                      { label: 'Dashed', value: 'dashed' }
                    ]
                  }}
                  value="none"
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="Border Width" isChanged={false}>
                <PropertyPanelLengthUnitInput value="0px" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Border Color" isChanged={false}>
                {/* TODO: Color */}
                <PropertyPanelLengthUnitInput value="0px" />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Corner Radius">
            <Box hasXSpacing>
              <PropertyPanelInput
                label="Editing corner"
                inputType={PropertyPanelInputType.IconRadio}
                value="left"
                properties={{
                  name: '',
                  options: [
                    {
                      icon: <Icon icon={IconName.RoundedCornerAll} />,
                      value: 'left'
                    },
                    {
                      icon: <Icon icon={IconName.RoundedCornerLeftUp} />,
                      value: 'center'
                    },
                    {
                      icon: <Icon icon={IconName.RoundedCornerRightUp} />,
                      value: 'right'
                    },
                    {
                      icon: <Icon icon={IconName.RoundedCornerRightDown} />,
                      value: 'right'
                    },
                    {
                      icon: <Icon icon={IconName.RoundedCornerLeftDown} />,
                      value: 'right'
                    }
                  ]
                }}
              />
            </Box>

            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Corner Radius" isChanged={false}>
                <PropertyPanelLengthUnitInput value="0px" />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Box Shadow">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Shadow Enabled" isChanged={false}>
                <PropertyPanelCheckbox value={false} />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Placement">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Pos X" isChanged={false}>
                <PropertyPanelLengthUnitInput value="0px" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Pos Y" isChanged={false}>
                <PropertyPanelLengthUnitInput value="0px" />
              </PropertyPanelRow>

              <PropertyPanelInput
                inputType={PropertyPanelInputType.Slider}
                label="Rotation"
                properties={{ min: -365, max: 365 }}
                value={0}
              />

              <PropertyPanelRow label="Scale" isChanged={false}>
                <PropertyPanelNumberInput value="1" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Transform Origin X" isChanged={false}>
                <PropertyPanelLengthUnitInput value="50%" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Transform Origin Y" isChanged={false}>
                <PropertyPanelLengthUnitInput value="50%" />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Dimension Constraints">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Min Width" isChanged={false}>
                <PropertyPanelLengthUnitInput value="auto" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Max Width" isChanged={false}>
                <PropertyPanelLengthUnitInput value="auto" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Min Height" isChanged={false}>
                <PropertyPanelLengthUnitInput value="auto" />
              </PropertyPanelRow>
              <PropertyPanelRow label="Max Height" isChanged={false}>
                <PropertyPanelLengthUnitInput value="auto" />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Pointer Events">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelInput
                label="Mode"
                inputType={PropertyPanelInputType.TextRadio}
                value="inherit"
                properties={{
                  options: [
                    { label: 'Inherit', value: 'inherit' },
                    { label: 'Explicit', value: 'explicit' }
                  ]
                }}
              />

              <PropertyPanelRow label="Block events" isChanged={false}>
                <PropertyPanelCheckbox value={true} />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="General">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="Mounted" isChanged={false}>
                <PropertyPanelCheckbox value={true} />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>

          <CollapsableSection title="Advanced Style">
            <Box hasXSpacing hasBottomSpacing>
              <PropertyPanelRow label="CSS Class" isChanged={false}>
                <PropertyPanelTextInput value="" />
              </PropertyPanelRow>
              <PropertyPanelRow label="CSS Style" isChanged={false}>
                <PropertyPanelButton
                  properties={{
                    buttonLabel: 'Edit'
                  }}
                />
              </PropertyPanelRow>
            </Box>
          </CollapsableSection>
        </VStack>
      </ScrollArea>
    </BasePanel>
  );
}
