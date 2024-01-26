import { useEffect, EffectCallback } from 'react';

export default function useOnMount(onMount: EffectCallback) {
  useEffect(onMount, []);
}
