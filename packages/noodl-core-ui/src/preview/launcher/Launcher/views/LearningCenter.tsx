import React from 'react';

import { Title } from '@noodl-core-ui/components/typography/Title';
import { LauncherPage } from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherPage';

export interface LearningCenterViewProps {}

export function LearningCenter({}: LearningCenterViewProps) {
  return <LauncherPage title="Learning Center"></LauncherPage>;
}
