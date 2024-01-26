import { useState } from 'react';

import { guid } from '@noodl-utils/utils';

import { ToastType } from '../views/ToastLayer/components/ToastCard';
import { ToastLayer } from '../views/ToastLayer/ToastLayer';

export interface ActivityQueue {
  activities: string[];
  hasActivity: boolean;
  runActivity: (message: string, callback: () => Promise<ActivityResult>) => Promise<void>;
  runQuietActivity(callback: (id: string) => Promise<void>): Promise<void>;
}

export type ActivityResult = {
  type: ToastType;
  message: string;
};

export interface UseActivityQueueOptions {
  errorMessage?: string;
  onSuccess?: () => Promise<void>;
  onError?: () => Promise<void>;
}

/**
 *
 * @returns
 */
export function useActivityQueue({
  errorMessage = 'Something went wrong',
  onSuccess,
  onError
}: UseActivityQueueOptions): ActivityQueue {
  const [activities, setActivities] = useState<string[]>([]);

  function addActivity(activityId: string) {
    setActivities((value) => {
      if (!value.includes(activityId)) {
        value.push(activityId);
      }
      return value;
    });
  }

  function removeActivity(activityId: string) {
    setActivities((value) => {
      if (value.includes(activityId)) {
        return value.filter((x) => x !== activityId);
      }
      return value;
    });
  }

  async function runActivity(message: string, callback: () => Promise<ActivityResult>): Promise<void> {
    const activityId = guid();
    addActivity(activityId);
    ToastLayer.showActivity(message, activityId);

    try {
      const response = await callback();
      ToastLayer.hideActivity(activityId);

      switch (response.type) {
        default:
        case ToastType.Neutral:
          ToastLayer.showInteraction(response.message);
          break;

        case ToastType.Danger:
          ToastLayer.showError(response.message);
          break;

        case ToastType.Success:
          ToastLayer.showSuccess(response.message);
          break;
      }

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      ToastLayer.hideActivity(activityId);
      ToastLayer.showError(errorMessage);

      if (onError) {
        await onError();
      }

      throw error;
    } finally {
      removeActivity(activityId);
    }
  }

  async function runQuietActivity(callback: (id: string) => Promise<void>): Promise<void> {
    const activityId = guid();
    addActivity(activityId);

    try {
      await callback(activityId);

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      ToastLayer.hideActivity(activityId);
      ToastLayer.showError(errorMessage);

      if (onError) {
        await onError();
      }

      throw error;
    } finally {
      removeActivity(activityId);
    }
  }

  return {
    activities,
    hasActivity: activities.length > 0,
    runActivity,
    runQuietActivity
  };
}
