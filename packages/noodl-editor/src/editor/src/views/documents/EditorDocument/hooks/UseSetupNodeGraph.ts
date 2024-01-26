import { useEffect, useState } from 'react';

import { ComponentModel } from '@noodl-models/componentmodel';
import { ProjectModel } from '@noodl-models/projectmodel';
import { getDefaultComponent } from '@noodl-models/projectmodel.utils';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import { NodeGraphEditor } from '../../../nodegrapheditor';

export function useSetupNodeGraph(nodeGraph: NodeGraphEditor) {
  //set nodegraph to a component when it's first created
  useSwitchToDefaultComponent(nodeGraph);

  //If the project is reloaded all the ComponentModels are new, so the node graph will have an old model as it's active component.
  //So we need to switch to the new version
  useSwitchToSameComponentAfterProjectReload(nodeGraph);

  //If the active component in the node graph is removed, switch to another component
  useSwitchComponentAfterActiveComponentDeleted(nodeGraph);
}

function useSwitchToDefaultComponent(nodeGraph: NodeGraphEditor) {
  useEffect(() => {
    const component = getDefaultComponent();
    nodeGraph.switchToComponent(component, { pushHistory: true });
  }, [nodeGraph]);
}

function useSwitchToSameComponentAfterProjectReload(nodeGraph: NodeGraphEditor) {
  useEffect(() => {
    const eventGroup = {};
    EventDispatcher.instance.on(
      'ProjectModel.instanceWillChange',
      () => {
        const activeComponentName = nodeGraph.activeComponent?.fullName;

        if (activeComponentName) {
          const hasChangedEventGroup = {};
          EventDispatcher.instance.on(
            'ProjectModel.instanceHasChanged',
            () => {
              EventDispatcher.instance.off(hasChangedEventGroup);

              const component = ProjectModel.instance.getComponentWithName(activeComponentName);
              if (component) {
                nodeGraph.switchToComponent(component);
              }
            },
            hasChangedEventGroup
          );
        }
      },
      eventGroup
    );

    return () => EventDispatcher.instance.off(eventGroup);
  }, [nodeGraph]);
}

function useSwitchComponentAfterActiveComponentDeleted(nodeGraph: NodeGraphEditor) {
  const [project, setProject] = useState(ProjectModel.instance);

  //Track the currently active project
  useEffect(() => {
    const eventGroup = {};
    EventDispatcher.instance.on('ProjectModel.instanceHasChanged', () => setProject(ProjectModel.instance), eventGroup);
    return () => EventDispatcher.instance.off(eventGroup);
  }, []);

  useEffect(() => {
    const eventGroup = {};
    project.on(
      'componentRemoved',
      ({ model }: { model: ComponentModel }) => {
        if (nodeGraph.activeComponent === model) {
          const component = getDefaultComponent();
          nodeGraph.switchToComponent(component);
        }
      },
      eventGroup
    );

    return () => {
      project.off(eventGroup);
    };
  }, [project, nodeGraph]);
}
