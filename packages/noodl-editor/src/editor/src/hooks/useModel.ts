import { useEffect, useState } from 'react';

import { Model as ModernModel, ModelEventEnum } from '@noodl-utils/model';

import Model from '../../../shared/model';

/**
 * const hosting = useModel(HostingModel.instance) // rerenders on all value updates
 * const hosting = useModel(HostingModel.instance, ['FrontendsFetched']) // rerender on FrontendsFetched event only
 *
 * useModelCallback(HostingModel.instance, (data) => console.log(data)) // runs on all value updates
 * useModelCallback(HostingModel.instance, (data) => console.log(data), ['FrontendsFetched']) // runs on FrontendsFetched event only
 */
export function useModel<TModel extends Model>(model: TModel, subscribedEvents?: string[]) {
  // set and update timestamp to force a component reload
  const [, setTimestamp] = useState(`${Date.now()}`);
  const [group] = useState({});

  useEffect(() => {
    function attachListener(event) {
      model.on(
        'Model.' + event,
        () => {
          setTimestamp(`Model.${event}: ${Date.now()}`);
        },
        group
      );
    }

    if (!subscribedEvents) {
      for (const event in model.events) {
        attachListener(event);
      }
    } else if (Array.isArray(subscribedEvents)) {
      subscribedEvents.forEach((event) => attachListener(event));
    }

    return () => {
      model.off(group);
    };
  }, []);

  return model;
}

export function useModernModel<TModel extends ModernModel<TEnum>, TEnum extends ModelEventEnum = any>(
  model: TModel,
  subscribedEvents?: TEnum[]
) {
  // set and update timestamp to force a component reload
  const [, setTimestamp] = useState(`${Date.now()}`);
  const [group] = useState({});

  useEffect(() => {
    function attachListener(event: TSFixme) {
      model.on(
        event,
        () => {
          setTimestamp(`${event}: ${Date.now()}`);
        },
        group
      );
    }

    if (!subscribedEvents) {
      attachListener('*');
    } else if (Array.isArray(subscribedEvents)) {
      subscribedEvents.forEach((event) => attachListener(event));
    }

    return () => {
      model.off(group);
    };
  }, []);

  return model;
}
