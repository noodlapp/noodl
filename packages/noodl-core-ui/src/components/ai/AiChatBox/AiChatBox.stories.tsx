import { ComponentMeta } from '@storybook/react';
import React, { useEffect, useState } from 'react';

import { AiChatLoader } from '@noodl-core-ui/components/ai/AiChatLoader';
import { AiChatMessage, AiChatMessageProps } from '@noodl-core-ui/components/ai/AiChatMessage';
import { AiChatSuggestion } from '@noodl-core-ui/components/ai/AiChatSuggestion';
import { SideNavigation, SideNavigationButton } from '@noodl-core-ui/components/app/SideNavigation';
import { IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextArea } from '@noodl-core-ui/components/inputs/TextArea';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { VStack } from '@noodl-core-ui/components/layout/Stack';

import { AiChatBox } from './AiChatBox';

export default {
  title: 'Ai/Ai ChatBox',
  component: AiChatBox,
  argTypes: {}
} as ComponentMeta<typeof AiChatBox>;

export const Preview = () => (
  <div style={{ maxWidth: '380px', height: '800px' }}>
    <SideNavigation
      toolbar={
        <>
          <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ flex: '1' }}>
            <SideNavigationButton icon={IconName.Components} label={'Components'} />
            <SideNavigationButton icon={IconName.Search} label={'Search'} />
            <SideNavigationButton icon={IconName.Collaboration} label={'Collaboration'} />
            <SideNavigationButton icon={IconName.StructureCircle} label={'Version control'} />
            <SideNavigationButton icon={IconName.CloudData} label={'Cloud Services'} />
            <SideNavigationButton icon={IconName.CloudFunction} label={'Cloud functions'} />
            <SideNavigationButton icon={IconName.Setting} label={'Project settings'} />
          </Container>
          <Container direction={ContainerDirection.Vertical}>
            <SideNavigationButton icon={IconName.SlidersHorizontal} label={'Editor settings'} />
          </Container>
        </>
      }
      panel={
        <AiChatBox
          footer={
            <>
              <TextArea value="Message" hasBottomSpacing isResizeDisabled UNSAFE_style={{ minHeight: '72px' }} />
              <VStack hasSpacing={1}>
                <PrimaryButton label="Send Message" size={PrimaryButtonSize.Small} isGrowing />
              </VStack>
            </>
          }
        >
          <AiChatMessage user={{ role: 'user', name: 'Tore K' }} content="Get the current weather at my location." />

          <AiChatMessage
            user={{ role: 'assistant' }}
            content="This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API. It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals."
          />

          <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
            <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
            <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
            <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
          </Box>
        </AiChatBox>
      }
    />
  </div>
);

export const WithAffix = () => (
  <div style={{ maxWidth: '380px', height: '800px' }}>
    <SideNavigation
      toolbar={
        <>
          <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ flex: '1' }}>
            <SideNavigationButton icon={IconName.Components} label={'Components'} />
            <SideNavigationButton icon={IconName.Search} label={'Search'} />
            <SideNavigationButton icon={IconName.Collaboration} label={'Collaboration'} />
            <SideNavigationButton icon={IconName.StructureCircle} label={'Version control'} />
            <SideNavigationButton icon={IconName.CloudData} label={'Cloud Services'} />
            <SideNavigationButton icon={IconName.CloudFunction} label={'Cloud functions'} />
            <SideNavigationButton icon={IconName.Setting} label={'Project settings'} />
          </Container>
          <Container direction={ContainerDirection.Vertical}>
            <SideNavigationButton icon={IconName.SlidersHorizontal} label={'Editor settings'} />
          </Container>
        </>
      }
      panel={
        <AiChatBox
          footer={
            <>
              <TextArea value="Message" hasBottomSpacing isResizeDisabled UNSAFE_style={{ minHeight: '72px' }} />
              <VStack hasSpacing={1}>
                <PrimaryButton label="Send Message" isGrowing />
              </VStack>
            </>
          }
        >
          <AiChatMessage user={{ role: 'user', name: 'Tore K' }} content="Get the current weather at my location." />

          <AiChatMessage
            user={{ role: 'assistant' }}
            content="This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API. It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals."
            affix={
              <PrimaryButton
                size={PrimaryButtonSize.Small}
                variant={PrimaryButtonVariant.MutedOnLowBg}
                icon={IconName.ImportSlanted}
                label="Open code editor"
                isGrowing
              />
            }
          />

          <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
            <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
            <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
            <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
          </Box>
        </AiChatBox>
      }
    />
  </div>
);

export const DifferentStates = () => (
  <div style={{ maxWidth: '380px', height: '800px' }}>
    <SideNavigation
      toolbar={
        <>
          <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ flex: '1' }}>
            <SideNavigationButton icon={IconName.Components} label={'Components'} />
            <SideNavigationButton icon={IconName.Search} label={'Search'} />
            <SideNavigationButton icon={IconName.Collaboration} label={'Collaboration'} />
            <SideNavigationButton icon={IconName.StructureCircle} label={'Version control'} />
            <SideNavigationButton icon={IconName.CloudData} label={'Cloud Services'} />
            <SideNavigationButton icon={IconName.CloudFunction} label={'Cloud functions'} />
            <SideNavigationButton icon={IconName.Setting} label={'Project settings'} />
          </Container>
          <Container direction={ContainerDirection.Vertical}>
            <SideNavigationButton icon={IconName.SlidersHorizontal} label={'Editor settings'} />
          </Container>
        </>
      }
      panel={
        <AiChatBox
          footer={
            <>
              <TextArea value="Message" hasBottomSpacing isResizeDisabled UNSAFE_style={{ minHeight: '72px' }} />
              <VStack hasSpacing={1}>
                <PrimaryButton label="Send Message" isGrowing />
              </VStack>
            </>
          }
        >
          <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
            <AiChatSuggestion text="Empty states" />
          </Box>
          <AiChatMessage user={{ role: 'user', name: 'Tore K' }} content="" />
          <AiChatMessage user={{ role: 'assistant' }} content="" />

          <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
            <AiChatSuggestion text="One-liners" />
          </Box>
          <AiChatMessage user={{ role: 'user', name: 'Tore K' }} content="One-liner" />
          <AiChatMessage user={{ role: 'assistant' }} content="One-liner" />

          <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
            <AiChatSuggestion text="Multi-liners" />
          </Box>
          <AiChatMessage user={{ role: 'user', name: 'Tore K' }} content={`Line 1\nLine 2`} />
          <AiChatMessage user={{ role: 'assistant' }} content={`Line 1\nLine 2`} />

          <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
            <AiChatSuggestion text="Wrapping Text" />
          </Box>
          <AiChatMessage
            user={{ role: 'user', name: 'Tore K' }}
            content={`This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API. It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals.`}
          />
          <AiChatMessage
            user={{ role: 'assistant' }}
            content={`This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API. It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals.`}
          />

          <AiChatLoader />
        </AiChatBox>
      }
    />
  </div>
);
type LiveItem = {
  chat: AiChatMessageProps;
};

const UserLiveItem: LiveItem = {
  chat: {
    user: { role: 'user', name: 'Tore K' },
    content: 'Get the current weather at my location.'
  }
};

const AssistantLiveItem: LiveItem = {
  chat: {
    user: { role: 'assistant' },
    content:
      "This Function node fetches a location's address using its latitude and longitude from Google's Geocoding API.\n\n It requires an API key, latitude, and longitude as inputs and outputs the formatted address and success or failure signals."
  }
};

export const LiveText = () => {
  const [messages, setMessages] = useState<LiveItem[]>([
    {
      chat: {
        user: { role: 'user', name: 'Tore K' },
        content: 'Get the current weather at my location.'
      }
    }
  ]);

  useEffect(() => {
    const func = () => {
      setMessages((prev) => {
        const last = prev.length ? prev[prev.length - 1] : null;
        if (last?.chat?.user?.role !== 'assistant') {
          return [...prev, AssistantLiveItem];
        } else {
          return [...prev, UserLiveItem];
        }
      });
    };

    const id = setInterval(func, 1000);
    return function () {
      clearInterval(id);
    };
  }, []);

  return (
    <div style={{ maxWidth: '380px', height: '800px' }}>
      <SideNavigation
        toolbar={
          <>
            <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ flex: '1' }}>
              <SideNavigationButton icon={IconName.Components} label={'Components'} />
              <SideNavigationButton icon={IconName.Search} label={'Search'} />
              <SideNavigationButton icon={IconName.Collaboration} label={'Collaboration'} />
              <SideNavigationButton icon={IconName.StructureCircle} label={'Version control'} />
              <SideNavigationButton icon={IconName.CloudData} label={'Cloud Services'} />
              <SideNavigationButton icon={IconName.CloudFunction} label={'Cloud functions'} />
              <SideNavigationButton icon={IconName.Setting} label={'Project settings'} />
            </Container>
            <Container direction={ContainerDirection.Vertical}>
              <SideNavigationButton icon={IconName.SlidersHorizontal} label={'Editor settings'} />
            </Container>
          </>
        }
        panel={
          <AiChatBox
            footer={
              <>
                <TextArea value="Message" hasBottomSpacing isResizeDisabled UNSAFE_style={{ minHeight: '72px' }} />
                <VStack hasSpacing={1}>
                  <PrimaryButton label="Send Message" size={PrimaryButtonSize.Small} isGrowing />
                </VStack>
              </>
            }
          >
            {messages.map((x, i) => (
              <AiChatMessage key={i} {...x.chat} />
            ))}

            {messages.length && messages[messages.length - 1]?.chat?.user?.role === 'assistant' && (
              <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
                <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
                <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
                <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
              </Box>
            )}
          </AiChatBox>
        }
      />
    </div>
  );
};

export const LongChatLog = () => {
  const [messages] = useState<LiveItem[]>(
    [...new Array(101)].map((_, index) => (index % 2 === 0 ? AssistantLiveItem : UserLiveItem))
  );

  return (
    <div style={{ maxWidth: '380px', height: '800px' }}>
      <SideNavigation
        toolbar={
          <>
            <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ flex: '1' }}>
              <SideNavigationButton icon={IconName.Components} label={'Components'} />
              <SideNavigationButton icon={IconName.Search} label={'Search'} />
              <SideNavigationButton icon={IconName.Collaboration} label={'Collaboration'} />
              <SideNavigationButton icon={IconName.StructureCircle} label={'Version control'} />
              <SideNavigationButton icon={IconName.CloudData} label={'Cloud Services'} />
              <SideNavigationButton icon={IconName.CloudFunction} label={'Cloud functions'} />
              <SideNavigationButton icon={IconName.Setting} label={'Project settings'} />
            </Container>
            <Container direction={ContainerDirection.Vertical}>
              <SideNavigationButton icon={IconName.SlidersHorizontal} label={'Editor settings'} />
            </Container>
          </>
        }
        panel={
          <AiChatBox
            footer={
              <>
                <TextArea value="Message" hasBottomSpacing isResizeDisabled UNSAFE_style={{ minHeight: '72px' }} />
                <VStack hasSpacing={1}>
                  <PrimaryButton label="Send Message" size={PrimaryButtonSize.Small} isGrowing />
                </VStack>
              </>
            }
          >
            {messages.map((x, i) => (
              <AiChatMessage key={i} {...x.chat} />
            ))}

            {messages.length && messages[messages.length - 1]?.chat?.user?.role === 'assistant' && (
              <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
                <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
                <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
                <AiChatSuggestion text="What are the required inputs for this node to work correctly?" />
              </Box>
            )}
          </AiChatBox>
        }
      />
    </div>
  );
};
