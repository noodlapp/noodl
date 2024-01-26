import { useEffect } from 'react';

export default function useLogEffect(data: unknown, key?: string) {
  console.warn('USING useLogEffect, REMOVE BEFORE DEPLOY');

  useEffect(() => {
    if (Boolean(key)) {
      console.debug(key, data);
    } else {
      console.debug(data);
    }
  }, [data]);
}
