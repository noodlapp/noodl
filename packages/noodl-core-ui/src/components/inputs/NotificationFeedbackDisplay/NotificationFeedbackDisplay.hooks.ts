import { useEffect, useState } from 'react';
import { InputNotification } from '@noodl-types/globalInputTypes';

export function useNotificationFeedbackDisplay(initialNotification: InputNotification | null) {
  const [newNotification, setNewNotification] = useState<InputNotification | null>(null);

  function updateNotification(notificationObject: InputNotification | null) {
    setNewNotification(null);

    if (notificationObject) {
      requestAnimationFrame(() => {
        setNewNotification(notificationObject);
      });
    }
  }

  useEffect(() => {
    updateNotification(initialNotification);
  }, [initialNotification]);

  return [newNotification, updateNotification] as [
    InputNotification,
    (notificationObject: InputNotification | null) => void
  ];
}
