import { ProjectModel } from '../projectmodel';

class NodeTypeAdapter {
  constructor(public typename: string) {}

  findAllNodes() {
    return ProjectModel.instance.getNodesWithType(this.typename);
  }
}

export default NodeTypeAdapter;
