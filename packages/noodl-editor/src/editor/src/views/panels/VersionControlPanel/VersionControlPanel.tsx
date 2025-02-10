import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Git } from '@noodl/git';
import { platform } from '@noodl/platform';

import { AppRegistry } from '@noodl-models/app_registry';
import { ProjectModel } from '@noodl-models/projectmodel';
import { WarningsModel } from '@noodl-models/warningsmodel';
import { LocalProjectsModel } from '@noodl-utils/LocalProjectsModel';
import { mergeProject } from '@noodl-utils/projectmerger';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { Tabs, TabsVariant } from '@noodl-core-ui/components/layout/Tabs';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { Text } from '@noodl-core-ui/components/typography/Text';

import { VersionControlPanel_ID } from '.';
import { EventDispatcher } from '../../../../../shared/utils/EventDispatcher';
import { ComponentDiffDocumentProvider } from '../../documents/ComponentDiffDocument';
import { EditorDocumentProvider } from '../../documents/EditorDocument';
import PopupLayer from '../../popuplayer';
import { useIsActivePanel } from '../useIsActivePanel';
import { BranchMerge } from './components/BranchMerge';
import { BranchStatusButton } from './components/BranchStatusButton';
import { GitProviderPopout } from './components/GitProviderPopout/GitProviderPopout';
import { GitStatusButton } from './components/GitStatusButton';
import { History } from './components/History';
import { LocalChanges } from './components/LocalChanges';
import { MergeConflicts } from './components/MergeConflicts';
import { useVersionControlContext, VersionControlProvider } from './context';
import { convertGitRemoteUrlToRepoUrl } from './github';

enum ViewState {
  Default,
  Branches,
  BranchMerge
}

function BaseVersionControlPanel() {
  const { git, activeTabId, setActiveTabId, localChangesCount, branchStatus, fetch, updateLocalDiff } =
    useVersionControlContext();
  const historyCount = fetch.localCommitCount + fetch.remoteCommitCount;

  const isActivePanel = useIsActivePanel(VersionControlPanel_ID);
  const shouldUpdateDiff = useRef(true);

  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const eventGroup = {};

    if (!isActivePanel) {
      //if we're switching to another panel make sure we close any open diff documents
      if (AppRegistry.instance.CurrentDocumentId === ComponentDiffDocumentProvider.ID) {
        AppRegistry.instance.openDocument(EditorDocumentProvider.ID);
      }

      //check if project is saved while we're inactive, and if so, diff next time we're active
      EventDispatcher.instance.on(
        ['ProjectModel.projectSavedToDisk', 'ProjectModel.instanceHasChanged'],
        () => {
          shouldUpdateDiff.current = true;
        },
        eventGroup
      );
    } else {
      //we're now the active panel, fetch local changes and update diff if needed
      fetch.fetchLocal().then(() => {
        if (shouldUpdateDiff.current === true) {
          shouldUpdateDiff.current = false;
          updateLocalDiff();
        }
      });

      //if project is saved and we're active, update the diff
      EventDispatcher.instance.on(
        ['ProjectModel.projectSavedToDisk', 'ProjectModel.instanceHasChanged'],
        () => {
          updateLocalDiff();
        },
        eventGroup
      );
    }

    return () => {
      EventDispatcher.instance.off(eventGroup);
    };
  }, [isActivePanel]);

  const hasConflictsInProject = useHasConflictsInProject();

  // NOTE: The keep alive stuff here is a little confusing,
  //       but are designed in a way to be performant.
  let viewState = ViewState.Default;

  if (branchStatus) {
    switch (branchStatus.kind) {
      case 'merge':
        viewState = ViewState.BranchMerge;
        break;
    }
  }

  function openGitSettingsPopout() {
    const popoutDiv = document.createElement('div');

    ReactDOM.render(React.createElement(GitProviderPopout, { git }), popoutDiv);

    //the timeout is needed to solve a bug when the popout us opened from the git status button
    //it causes timing issues between native events and react where the popout is instantly closed
    setTimeout(() => {
      PopupLayer.instance.showPopout({
        content: { el: [popoutDiv] },
        attachTo: $(settingsButtonRef.current),
        position: 'right',
        disableDynamicPositioning: true,
        onClose: () => {
          ReactDOM.unmountComponentAtNode(popoutDiv);
          fetch.fetchRemote();
        }
      });
    }, 1);
  }

  return (
    <BasePanel
      isFill
      title="Version Control"
      headerSlot={
        <HStack hasSpacing={1}>
          {git.Provider === 'github' && (
            <IconButton
              icon={IconName.ExternalLink}
              size={IconSize.Small}
              variant={IconButtonVariant.OpaqueOnHover}
              onClick={() => {
                const githubLink = convertGitRemoteUrlToRepoUrl(git.OriginUrl);
                platform.openExternal(githubLink);
                // TODO: Toast
              }}
            />
          )}
          {git.Provider && (
            <IconButton
              ref={settingsButtonRef}
              icon={IconName.Setting}
              size={IconSize.Small}
              variant={IconButtonVariant.OpaqueOnHover}
              onClick={(ev) => {
                ev.stopPropagation();

                openGitSettingsPopout();
              }}
            />
          )}
        </HStack>
      }
    >
      <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ height: '100%', isolation: 'isolate' }}>
        {hasConflictsInProject ? (
          <MergeConflicts />
        ) : (
          <>
            <GitStatusButton openGitSettingsPopout={openGitSettingsPopout} />
            <BranchStatusButton />
            {viewState === ViewState.BranchMerge && <BranchMerge />}
          </>
        )}

        {viewState !== ViewState.BranchMerge && (
          <Tabs
            variant={TabsVariant.Sidebar}
            keepTabsAlive
            activeTab={activeTabId}
            onChange={(activeTab) => setActiveTabId(activeTab)}
            tabs={[
              {
                id: 'changes',
                label: localChangesCount ? `Local Changes (${localChangesCount})` : 'Local Changes',
                content: <LocalChanges hasConflictsInProject={hasConflictsInProject} />
              },
              {
                id: 'history',
                label: historyCount > 0 ? `History (${historyCount})` : 'History',
                content: <History />
              }
            ]}
          />
        )}
      </Container>
    </BasePanel>
  );
}

export function VersionControlPanel() {
  const [git, setGit] = useState<Git>(null);
  const [state, setState] = useState<'loading' | 'loaded' | 'not-git'>('loading');

  async function createGit() {
    const gitClient = new Git(mergeProject);
    await gitClient.openRepository(ProjectModel.instance._retainedProjectDirectory);
    setGit(gitClient);
  }

  useEffect(() => {
    LocalProjectsModel.instance
      .isGitProject(ProjectModel.instance)
      .then(async (isGitProject) => {
        if (isGitProject) {
          await createGit();
          setState('loaded');
        } else {
          setState('not-git');
        }
      });
  }, []);

  async function setupGit() {
    const gitClient = new Git(mergeProject);
    await gitClient.initNewRepo(ProjectModel.instance._retainedProjectDirectory);
    await gitClient.commit('Initial commit');
    setGit(gitClient);
  }

  if (git === null && state === 'not-git') {
    return (
      <BasePanel isFill title="Version Control">
        <Box hasXSpacing hasYSpacing>
          <Text hasBottomSpacing>This project is missing a git setup.</Text>
          <PrimaryButton label="Initialize Version Control (git)" isGrowing onClick={setupGit} />
        </Box>
      </BasePanel>
    );
  }

  // TODO: Loading state? Should be really quick though
  if (git === null) {
    return null;
  }

  return (
    <VersionControlProvider git={git}>
      <BaseVersionControlPanel />
    </VersionControlProvider>
  );
}

export function useHasConflictsInProject() {
  const [hasConflicts, setHasConflicts] = useState<boolean>(false);

  // Listen for changes to conflicts
  useEffect(() => {
    const checkForWarnings = () => {
      setHasConflicts(
        WarningsModel.instance.getTotalNumberOfWarningsMatching(
          (_key, _ref, warning) =>
            warning.warning.type === 'conflict' || warning.warning.type === 'conflict-source-code'
        ) > 0
      );
    };

    const eventGroup = {};

    WarningsModel.instance.on('warningsChanged', checkForWarnings, eventGroup);

    checkForWarnings();

    return () => {
      WarningsModel.instance.off(eventGroup);
    };
  }, []);

  return hasConflicts;
}
