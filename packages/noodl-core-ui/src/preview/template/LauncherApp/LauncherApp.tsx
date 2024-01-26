import classNames from 'classnames';
import React from 'react';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { Logo } from '@noodl-core-ui/components/common/Logo';
import { ExternalLink } from '@noodl-core-ui/components/inputs/ExternalLink';
import { IconButton, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { ListItem } from '@noodl-core-ui/components/layout/ListItem';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize, TitleVariant } from '@noodl-core-ui/components/typography/Title';
import { UserBadge, UserBadgeSize } from '@noodl-core-ui/components/user/UserBadge';
import { UserListingCard, UserListingCardVariant } from '@noodl-core-ui/components/user/UserListingCard';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './LauncherApp.module.scss';

/**
 * Returns whether we are running inside the storybook editor canvas.
 *
 * @returns
 */
export function insideFrame() {
  // // The page is in an iframe
  return window.location !== window.parent.location;
}

export interface LauncherSectionProps extends UnsafeStyleProps {
  hasTopBorder?: boolean;

  children: JSX.Element | JSX.Element[];
}

export function LauncherSection({ hasTopBorder, children, UNSAFE_style, UNSAFE_className }: LauncherSectionProps) {
  return (
    <div
      style={{
        width: '100%',
        borderTop: hasTopBorder ? '1px solid var(--theme-color-bg-3)' : null,
        padding: '30px',
        boxSizing: 'border-box',
        ...UNSAFE_style
      }}
      className={UNSAFE_className}
    >
      {children}
    </div>
  );
}

export function LauncherSidebarExample() {
  return (
    <Container direction={ContainerDirection.Vertical} hasSpaceBetween>
      <Container direction={ContainerDirection.Vertical}>
        <LauncherSection>
          <Logo />
        </LauncherSection>

        <Container hasXSpacing>
          <Container direction={ContainerDirection.Horizontal} hasXSpacing>
            <Container direction={ContainerDirection.Vertical}>
              <Text>Workspace</Text>
              <Title variant={TitleVariant.Highlighted} size={TitleSize.Large} hasBottomSpacing>
                Noodl tutorials
              </Title>
            </Container>
            <Icon icon={IconName.CaretDown} />
          </Container>
        </Container>

        <LauncherSection>
          <Text>Workspace</Text>
          <Title variant={TitleVariant.Highlighted} size={TitleSize.Large} hasBottomSpacing>
            Noodl tutorials
          </Title>
        </LauncherSection>

        <Section>
          <Container hasXSpacing hasYSpacing>
            <Container hasXSpacing hasTopSpacing>
              <UserBadge email="john@noodl.net" id="20" name="John Doe" size={UserBadgeSize.Small} hasRightSpacing />
              <UserBadge email="john@noodl.net" id="20" name="John Doe" size={UserBadgeSize.Small} hasRightSpacing />
              <UserBadge email="john@noodl.net" id="20" name="John Doe" size={UserBadgeSize.Small} hasRightSpacing />
              <UserBadge email="john@noodl.net" id="20" name="John Doe" size={UserBadgeSize.Small} hasRightSpacing />
              <UserBadge email="john@noodl.net" id="20" name="John Doe" size={UserBadgeSize.Small} hasRightSpacing />
              <IconButton
                icon={IconName.DotsThreeHorizontal}
                variant={IconButtonVariant.Transparent}
                size={IconSize.Small}
              />
            </Container>
          </Container>
          <Container direction={ContainerDirection.Vertical} hasBottomSpacing>
            <ListItem gutter={2} text="Invite" icon={IconName.Plus} />
          </Container>
        </Section>

        <Section>
          <Container direction={ContainerDirection.Vertical} hasYSpacing>
            <ListItem gutter={2} text="Learn" icon={IconName.Palette} />
            <ListItem gutter={2} text="Projects" icon={IconName.Components} />
          </Container>
        </Section>

        {/*
          <Section>
            <Container direction={ContainerDirection.Vertical} hasYSpacing>
              <ListItem gutter={2} text="Recent projects" />
              <ListItem gutter={2} text="Project A" />
              <ListItem gutter={2} text="Project B" />
              <ListItem gutter={2} text="Project C" />
            </Container>
          </Section>
        */}

        <Section>
          <Container direction={ContainerDirection.Vertical} hasYSpacing>
            <ListItem gutter={2} text="Documentation" icon={IconName.File} />
            <ListItem gutter={2} text="Community" icon={IconName.Chat} />
          </Container>
        </Section>
      </Container>

      <Section>
        <Container direction={ContainerDirection.Vertical} hasXSpacing hasYSpacing>
          <UserListingCard variant={UserListingCardVariant.Launcher} email="john@noodl.net" id="20" name="John Doe" />
        </Container>
      </Section>
    </Container>
  );
}

export interface LauncherAppProps {
  title?: string;

  sidePanel?: JSX.Element;

  children?: JSX.Element | JSX.Element[];
}

export function LauncherApp({ title = 'Noodl Launcher', sidePanel, children }: LauncherAppProps) {
  const size = insideFrame()
    ? {
        width: 1280,
        height: 1000
      }
    : {
        width: 1440,
        height: 1024
      };

  return (
    <div
      className={classNames([css['Root']])}
      style={{
        ...size
      }}
    >
      <div className={classNames([css['TitleBar']])}>{title}</div>
      <div className={classNames([css['SidePanel']])}>{sidePanel}</div>
      <div>{children}</div>
    </div>
  );
}
