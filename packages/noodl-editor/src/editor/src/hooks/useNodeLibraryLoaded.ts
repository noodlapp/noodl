import { useEffect, useState } from 'react';
import { NodeLibrary } from '@noodl-models/nodelibrary';

export function useNodeLibraryLoaded() {
  const [group] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function update() {
      setLoaded(NodeLibrary.instance.isLoaded());
    }

    update();

    NodeLibrary.instance.on('libraryUpdated', update, group);

    return function () {
      NodeLibrary.instance.off(group);
    };
  }, []);

  return loaded;
}
