import React from 'react';

import { Logo } from '@noodl-core-ui/components/common/Logo';
import { DialogRenderDirection } from '@noodl-core-ui/components/layout/BaseDialog';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { ListItem } from '@noodl-core-ui/components/layout/ListItem';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { ContextMenu } from '@noodl-core-ui/components/popups/ContextMenu';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { Label, LabelSize, LabelSpacingSize } from '@noodl-core-ui/components/typography/Label';
import { TextType } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize, TitleVariant } from '@noodl-core-ui/components/typography/Title';
import { UserBadge, UserBadgeSize } from '@noodl-core-ui/components/user/UserBadge';
import { LauncherPageMetaData } from '@noodl-core-ui/preview/launcher/Launcher/Launcher';
import { LauncherSection } from '@noodl-core-ui/preview/template/LauncherApp';

import css from './LauncherSidebar.module.scss';

const VERSION_NUMBER = '2.9.3';
export interface LauncherSidebarProps {
  pages: LauncherPageMetaData[];
  setActivePageId: (page: LauncherPageMetaData['id'] | string) => void;
  activePageId: LauncherPageMetaData['id'];
}

export function LauncherSidebar({ pages, activePageId, setActivePageId }: LauncherSidebarProps) {
  return (
    <Container direction={ContainerDirection.Vertical} hasSpaceBetween>
      <Container direction={ContainerDirection.Vertical}>
        <LauncherSection>
          <Logo />
        </LauncherSection>

        <LauncherSection>
          <HStack UNSAFE_style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Title variant={TitleVariant.Highlighted} size={TitleSize.Large}>
                Noodl {VERSION_NUMBER}
              </Title>
            </div>

            <ContextMenu
              menuItems={[{ label: 'Check for updates', onClick: () => alert('FIXME: check updates') }]}
              renderDirection={DialogRenderDirection.Horizontal}
            />
          </HStack>
        </LauncherSection>

        <Section>
          <div style={{ padding: '0 10px' }}>
            <Container direction={ContainerDirection.Vertical} hasYSpacing>
              {pages.map((page) => (
                <ListItem
                  text={page.displayName}
                  icon={page.icon}
                  gutter={2}
                  onClick={() => setActivePageId(page.id)}
                  isActive={page.id === activePageId}
                  UNSAFE_style={{ borderRadius: 2 }}
                />
              ))}
            </Container>
          </div>
        </Section>

        <Section>
          <div style={{ padding: '0 10px' }}>
            <Container direction={ContainerDirection.Vertical} hasYSpacing>
              <Label
                size={LabelSize.Small}
                variant={TextType.Shy}
                hasBottomSpacing={LabelSpacingSize.Large}
                UNSAFE_style={{ paddingLeft: 20 }}
              >
                Resources
              </Label>
              <ListItem gutter={5} text="Documentation" hasHiddenIconSlot UNSAFE_style={{ borderRadius: 2 }} />
              <ListItem gutter={5} text="YouTube" hasHiddenIconSlot UNSAFE_style={{ borderRadius: 2 }} />
              <ListItem gutter={5} text="Discord" hasHiddenIconSlot UNSAFE_style={{ borderRadius: 2 }} />
            </Container>
          </div>
        </Section>
      </Container>
    </Container>
  );
}
