import React, { useState } from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import {
  CloudSyncType,
  LauncherProjectData
} from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherProjectCard';
import { LauncherSidebar } from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherSidebar';
import { LearningCenter } from '@noodl-core-ui/preview/launcher/Launcher/views/LearningCenter';
import { Projects } from '@noodl-core-ui/preview/launcher/Launcher/views/Projects';

import { LauncherApp } from '../../template/LauncherApp';

export interface LauncherProps {}

export enum LauncherPageId {
  LocalProjects,
  LearningCenter
}

export interface LauncherPageMetaData {
  id: LauncherPageId | string; // renders workspace page if starts with WORKSPACE_PAGE_PREFIX
  displayName: string;
  icon?: IconName;
}

// FIXME: make the mock data real
export const PAGES: LauncherPageMetaData[] = [
  {
    id: LauncherPageId.LocalProjects,
    displayName: 'Recent Projects',
    icon: IconName.CircleDot
  },
  {
    id: LauncherPageId.LearningCenter,
    displayName: 'Learn',
    icon: IconName.Rocket
  }
];

export const MOCK_PROJECTS: LauncherProjectData[] = [
  {
    id: '1',
    title: 'My first project',
    imageSrc: 'http://placekitten.com/g/200/300',
    localPath: '/User/Desktop/dev/my-first-project',
    lastOpened: '2023-10-26T12:22:13.462Z',
    cloudSyncMeta: {
      type: CloudSyncType.None,
      source: undefined
    },
    uncommittedChangesAmount: undefined,
    pullAmount: undefined,
    pushAmount: undefined
  },
  {
    id: '2',
    title: 'External git project with push but no pull',
    imageSrc: 'http://placekitten.com/g/400/800',
    localPath: '/User/Desktop/dev/area-51-employee-portal/top-secret-version',
    lastOpened: '2023-10-23T12:42:13.462Z',
    cloudSyncMeta: {
      type: CloudSyncType.Git,
      source: 'https://TESTHUB.com/org/testcompany/my-repo-project'
    },
    uncommittedChangesAmount: undefined,
    pullAmount: undefined,
    pushAmount: 666,
    contributors: [
      { email: 'tore@noodl.net', name: 'Tore Knudsen', id: 'Tore' },
      { email: 'eric@noodl.net', name: 'Eric Tuvesson', id: 'Eric' }
    ]
  },
  {
    id: '3',
    title: 'External git project with local changes',
    imageSrc: 'http://placekitten.com/g/500/500',
    localPath: '/User/Desktop/projects/my-git-repo',
    lastOpened: '2023-08-26T12:42:13.462Z',
    cloudSyncMeta: {
      type: CloudSyncType.Git,
      source: 'https://TESTHUB.com/org/testcompany/my-repo-project'
    },
    uncommittedChangesAmount: 4,
    pullAmount: undefined,
    pushAmount: undefined,
    contributors: [
      { email: 'tore@noodl.net', name: 'Tore Knudsen', id: 'Tore' },
      { email: 'eric@noodl.net', name: 'Eric Tuvesson', id: 'Eric' },
      { email: 'michael@noodl.net', name: 'Michael Cartner', id: 'Michael' },
      { email: 'mikael@noodl.net', name: 'Mikael Tellhed', id: 'Mikael' },
      { email: 'anders@noodl.net', name: 'Anders Larsson', id: 'Anders' },
      { email: 'johan@noodl.net', name: 'Johan Olsson', id: 'Johan' },
      { email: 'victor@noodl.net', name: 'Victor Permild', id: 'Victor' },
      { email: 'kotte@noodl.net', name: 'Kotte Aistre', id: 'Kotte' }
    ]
  },
  {
    id: '4',
    title: 'Git project with all notifications',
    imageSrc: 'http://placekitten.com/g/100/100',
    localPath: '/User/Desktop/projects/forgotten-project',
    lastOpened: '2023-06-26T12:42:13.462Z',
    cloudSyncMeta: {
      type: CloudSyncType.Git
    },
    uncommittedChangesAmount: 10,
    pullAmount: 10,
    pushAmount: 4,
    contributors: [
      { email: 'tore@noodl.net', name: 'Tore Knudsen', id: 'Tore' },
      { email: 'eric@noodl.net', name: 'Eric Tuvesson', id: 'Eric' },
      { email: 'michael@noodl.net', name: 'Michael Cartner', id: 'Michael' },
      { email: 'victor@noodl.net', name: 'Victor Permild', id: 'Victor' }
    ]
  }
];

export function Launcher({}: LauncherProps) {
  const pages = [...PAGES];
  const [activePageId, setActivePageId] = useState<LauncherPageMetaData['id']>(pages[0].id);

  function setActivePage(pageId: LauncherPageMetaData['id']) {
    setActivePageId(pageId);
    console.info(`Navigated to pageId ${pageId}`);
  }

  const activePage = pages.find((page) => page.id === activePageId);

  return (
    <LauncherApp
      sidePanel={<LauncherSidebar pages={pages} activePageId={activePageId} setActivePageId={setActivePage} />}
    >
      {activePageId === LauncherPageId.LocalProjects && <Projects />}
      {activePageId === LauncherPageId.LearningCenter && <LearningCenter />}
    </LauncherApp>
  );
}
