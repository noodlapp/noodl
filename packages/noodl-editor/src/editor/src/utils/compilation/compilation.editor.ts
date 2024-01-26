import { ProjectModel } from '@noodl-models/projectmodel';
import { Compilation, IFeedbackProvider } from '@noodl-utils/compilation/compilation';

import { ToastLayer } from '../../views/ToastLayer/ToastLayer';

/**
 * Create a Compilation instance with Editor settings.
 *
 * @param project
 * @returns
 */
export function createEditorCompilation(project: ProjectModel) {
  const feedback: IFeedbackProvider = {
    showActivity: ToastLayer.showActivity,
    hideActivity: ToastLayer.hideActivity,
    showSuccess: ToastLayer.showSuccess,
    showError: ToastLayer.showError,
    showInteraction: ToastLayer.showInteraction
  };

  return new Compilation(project, feedback, {
    cloneProject: true
  });
}
