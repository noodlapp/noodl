import useOnMount from './useOnMount';

export default function useOnUnmount(onUnmount: () => void) {
  useOnMount(() => onUnmount);
}
