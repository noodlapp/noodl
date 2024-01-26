import { ComponentModel } from '@noodl-models/componentmodel';
import { ProjectModel } from '@noodl-models/projectmodel';
import { isComponentModel_BrowserRuntime } from '@noodl-utils/NodeGraph';

export function getDefaultComponent(instance = ProjectModel.instance): ComponentModel {
  let component =
    instance.getComponentWithName('/Main') ||
    instance.getComponentWithName('/Start') ||
    instance.getComponentWithName('/Lesson');

  if (!component) {
    component = instance.getRootComponent();
  }

  if (!component) {
    component = instance.getComponents().find(isComponentModel_BrowserRuntime);
  }

  return component;
}
