import { AppRegistry } from '@noodl-models/app_registry';
import { ComponentModel } from '@noodl-models/componentmodel';
import { useEffect } from 'react';
import { ComponentDiffDocumentProvider } from '../../../documents/ComponentDiffDocument';
import { EditorDocumentProvider } from '../../../documents/EditorDocument';

export function useShowComponentDiffDocument({
  component,
  title,
  onDocumentClosed
}: {
  component: ComponentModel;
  title: string;
  onDocumentClosed: () => void;
}) {
  useEffect(() => {
    if (!component) {
      //if component is set to null after we have navigated to a diff, close the document
      if (AppRegistry.instance.CurrentDocumentId === ComponentDiffDocumentProvider.ID) {
        AppRegistry.instance.openDocument(EditorDocumentProvider.ID);
      }
      return;
    }

    AppRegistry.instance.openDocument(ComponentDiffDocumentProvider.ID, { component, title });

    const eventGroup = {};

    //If diff document is closed we want to deselect active component
    AppRegistry.instance.on(
      'documentChanged',
      () => {
        if (AppRegistry.instance.CurrentDocumentId !== ComponentDiffDocumentProvider.ID) {
          onDocumentClosed();
        }
      },
      eventGroup
    );

    return () => {
      AppRegistry.instance.off(eventGroup);
    };
  }, [component]);

  //close diff document when view unmounts
  useEffect(() => {
    return () => {
      if (AppRegistry.instance.CurrentDocumentId === ComponentDiffDocumentProvider.ID) {
        AppRegistry.instance.openDocument(EditorDocumentProvider.ID);
      }
    };
  }, []);
}
