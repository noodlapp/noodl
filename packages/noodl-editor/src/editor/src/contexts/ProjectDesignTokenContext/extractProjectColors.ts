import { ProjectModel } from '@noodl-models/projectmodel';

export type DesignTokenColor = {
  name: string;
  color: string;
  refs: string[];
};

export function extractProjectColors(
  project: ProjectModel,
  colorStyles: {
    name: string;
    style: string;
  }[]
): {
  staticColors: DesignTokenColor[];
  dynamicColors: DesignTokenColor[];
} {
  const colors: { [key: string]: DesignTokenColor } = {};

  const components = project.getComponents();
  components.forEach((c) => {
    c.graph.forEachNode((node) => {
      const colorPorts = node.getPorts('input').filter((p) => p.type === 'color');
      const values = colorPorts.map((port) => node.getParameter(port.name));
      values
        .filter((name) => name)
        .forEach((name) => {
          if (!colors[name]) {
            colors[name] = {
              name,
              color: null,
              refs: []
            };
          }
          colors[name].refs.push(node.type.name);
        });
    });
  });

  const staticColors = Object.values(colors)
    .filter((c) => colorStyles.find((s) => s.name === c.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((x) => ({
      name: x.name,
      refs: x.refs,
      color: ProjectModel.instance.resolveColor(x.name)
    }));

  const dynamicColors = Object.values(colors)
    // remove all color styles from the list, so we only get the #HEX colors
    .filter((c) => !colorStyles.find((s) => s.name === c.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((x) => ({
      name: x.name,
      refs: x.refs,
      color: ProjectModel.instance.resolveColor(x.name)
    }));

  return {
    staticColors,
    dynamicColors
  };
}
