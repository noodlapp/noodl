import { ComponentModel } from '@noodl-models/componentmodel';

export interface ComponentsPanelFolderOptions {
  name: string;
  folders: TSFixme[];
  components: TSFixme[];
  component?: TSFixme;
  parent?: TSFixme;
}

export class ComponentsPanelFolder {
  public name: string;
  public folders: ComponentsPanelFolder[];

  components: ComponentModel[];
  component: TSFixme;
  parent?: ComponentsPanelFolder;
  isOpen: boolean;

  constructor(args: ComponentsPanelFolderOptions) {
    this.name = args.name;
    this.folders = args.folders;
    this.components = args.components;
    this.component = args.component;
    this.parent = args.parent;
    this.isOpen = false;
  }

  isEmpty() {
    return this.folders.length === 0 && this.components.length === 0;
  }

  addComponent(c) {
    if (this.components.indexOf(c) !== -1) return; // Component already exists in folder

    this.components.push(c);
    this.components.sort(function (a, b) {
      return a.localName < b.localName ? -1 : 1;
    });
  }

  removeComponent(c) {
    var idx = this.components.indexOf(c);
    if (idx !== -1) this.components.splice(idx, 1);
    else {
      // See if any of my folders has this component as "folder component"
      const folderComponent = this.folders.find((f) => f.component === c);
      if (folderComponent) {
        delete folderComponent.component;
        if (folderComponent.folders.length === 0 && folderComponent.components.length === 0) {
          // This is an empty folder, remove it
          this.removeFolder(folderComponent);
        }
      }
    }
  }

  addFolder(folder: ComponentsPanelFolder) {
    folder.parent = this;
    this.folders.push(folder);
    this.folders.sort(function (a, b) {
      return a.name < b.name ? -1 : 1;
    });
  }

  removeFolder(f) {
    f.parent = undefined;
    var idx = this.folders.indexOf(f);
    idx !== -1 && this.folders.splice(idx, 1);
  }

  hasFolderWithName(name) {
    for (var i in this.folders) {
      if (this.folders[i].name === name) return true;
    }
    return false;
  }

  isAncestorTo(f) {
    var parent = f.parent;
    while (parent) {
      if (parent === this) return true;
      parent = parent.parent;
    }
    return false;
  }

  hasComponentWithName(name) {
    for (var i in this.components) {
      if (this.components[i].localName === name) return true;
    }
    return false;
  }

  getPath() {
    return (this.parent ? this.parent.getPath() : '') + this.name + '/';
  }
}
