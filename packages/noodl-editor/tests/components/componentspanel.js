const { ComponentsPanelView } = require('@noodl-views/panels/componentspanel/ComponentsPanel');
const { ProjectModel } = require('@noodl-models/projectmodel');
const { UndoQueue } = require('@noodl-models/undo-queue-model');
const NodeGraphEditor = require('@noodl-views/nodegrapheditor').NodeGraphEditor;
const ViewerConnection = require('../../src/editor/src/ViewerConnection');

describe('Components panel unit tests', function () {
  var cp;
  var p1;

  var project = {
    components: [
      {
        name: 'Root',
        graph: {}
      },
      {
        name: '/test/f1/a',
        graph: {}
      },
      {
        name: '/test/f2/a',
        graph: {}
      },
      {
        name: '/b',
        graph: {}
      },
      {
        name: '/test/ff/a',
        graph: {}
      },
      {
        name: '/q',
        graph: {}
      },
      {
        name: '/a',
        graph: {}
      },
      {
        name: '/dup/f1/a',
        graph: {}
      },
      // Undo tests
      {
        name: '/delete_folder/delete_comp',
        graph: {}
      },
      {
        name: '/rename_folder/rename_comp',
        graph: {}
      },
      {
        name: '/drop/a',
        graph: {}
      },
      {
        name: '/drop2/a',
        graph: {}
      },
      {
        name: '/dropundo',
        graph: {}
      },
      {
        name: '/nested-target/a',
        graph: {}
      },
      {
        name: '/nested-dropme/test/b',
        graph: {}
      },
      {
        name: '/delete-me/with-content/a',
        graph: {}
      },
      {
        name: '/delete-me/b',
        graph: {}
      }
    ]
  };

  beforeAll(() => {
    // Mock node graph editor
    NodeGraphEditor.instance = {
      getActiveComponent() {
        return p1.getComponentWithName('Root');
      },
      on() {},
      off() {},
      switchToComponent() {}
    };

    // Viewerconnection mock
    ViewerConnection.instance = {
      on() {},
      off() {}
    };
  });

  afterAll(() => {
    NodeGraphEditor.instance = undefined;
    ViewerConnection.instance = undefined;
  });

  beforeEach(() => {
    p1 = ProjectModel.instance = ProjectModel.fromJSON(project);
    cp = new ComponentsPanelView({});
    cp.setNodeGraphEditor(NodeGraphEditor.instance);
    cp.render();
  });

  afterEach(() => {
    cp.dispose();
    ProjectModel.instance = undefined;
  });

  it('can setup view', function () {
    expect(cp).not.toBe(undefined);
  });

  it('can add new folders', function () {
    // Existing folder
    expect(
      cp.performAdd({
        type: 'folder',
        name: 'test'
      }).success
    ).toBe(false);

    // Empty name
    expect(
      cp.performAdd({
        type: 'folder',
        name: ''
      }).success
    ).toBe(false);

    // Add
    expect(
      cp.performAdd({
        type: 'folder',
        name: 'f3'
      }).success
    ).toBe(true);

    expect(cp.getFolderWithPath('/f3/')).not.toBe(undefined);
  });

  it('can add components', function () {
    // Existing name
    expect(
      cp.performAdd({
        type: 'component',
        name: 'b',
        parentPath: '/'
      }).success
    ).toBe(false);

    // Empty name
    expect(
      cp.performAdd({
        type: 'component',
        name: ''
      }).success
    ).toBe(false);

    // Add
    expect(
      cp.performAdd({
        type: 'component',
        name: 'c',
        parentPath: '/'
      }).success
    ).toBe(true);

    expect(p1.getComponentWithName('/c')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/').hasComponentWithName('c')).toBe(true);

    // Add to sub directory
    expect(
      cp.performAdd({
        type: 'component',
        name: 'subsub',
        parentPath: '/test/ff/'
      }).success
    ).toBe(true);

    expect(p1.getComponentWithName('/test/ff/subsub')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/test/ff/').hasComponentWithName('subsub')).toBe(true);
  });

  it('can rename folders', function () {
    // Existing name
    expect(
      cp.performRename({
        type: 'folder',
        name: 'f2',
        folder: cp.getFolderWithPath('/test/ff/')
      }).success
    ).toBe(false);

    // Empty name
    expect(
      cp.performRename({
        type: 'folder',
        name: '',
        folder: cp.getFolderWithPath('/test/ff/')
      }).success
    ).toBe(false);

    // Empty name
    expect(
      cp.performRename({
        type: 'folder',
        name: 'f4',
        folder: cp.getFolderWithPath('/test/ff/')
      }).success
    ).toBe(true);

    expect(p1.getComponentWithName('/test/ff/a')).toBe(undefined);
    expect(p1.getComponentWithName('/test/f4/a')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/test/ff/')).toBe(undefined);
    expect(cp.getFolderWithPath('/test/f4/')).not.toBe(undefined);
  });

  it('can rename components', function () {
    // Existing name
    expect(
      cp.performRename({
        type: 'component',
        name: 'b',
        folder: cp.getFolderWithPath('/'),
        component: p1.getComponentWithName('/q')
      }).success
    ).toBe(false);

    // Empty name
    expect(
      cp.performRename({
        type: 'component',
        name: '',
        folder: cp.getFolderWithPath('/'),
        component: p1.getComponentWithName('/q')
      }).success
    ).toBe(false);

    // Empty name
    expect(
      cp.performRename({
        type: 'component',
        name: 'q2',
        folder: cp.getFolderWithPath('/'),
        component: p1.getComponentWithName('/q')
      }).success
    ).toBe(true);

    expect(p1.getComponentWithName('/q')).toBe(undefined);
    expect(p1.getComponentWithName('/q2')).not.toBe(undefined);
  });

  it('can detect duplicates', function () {
    // Cannot move to folder containing a comp with same name
    expect(
      cp.getAcceptableDropType({
        type: 'component',
        component: p1.getComponentWithName('/a'),
        targetFolder: cp.getFolderWithPath('/test/f1/')
      })
    ).toBe(false);

    // Cannot move folder to folder containing a folder with same name
    expect(
      cp.getAcceptableDropType({
        type: 'folder',
        folder: cp.getFolderWithPath('/dup/f1/'),
        targetFolder: cp.getFolderWithPath('/test/')
      })
    ).toBe(false);
  });

  it('can make correct drops of folders', function () {
    // Can move a folder into a folder
    expect(
      cp.getAcceptableDropType({
        type: 'folder',
        folder: cp.getFolderWithPath('/test/f1/'),
        targetFolder: cp.getFolderWithPath('/test/f2/')
      })
    ).toBe('folder');

    // Make the move
    cp.dropOn({
      type: 'folder',
      folder: cp.getFolderWithPath('/test/f1/'),
      targetFolder: cp.getFolderWithPath('/test/f2/')
    });

    expect(p1.getComponentWithName('/test/f2/f1/a')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/test/f2/f1/').name).toBe('f1');
    // expect(cp.getFolderWithPath('/test/f1/')).toBe(undefined);

    // Moving to an ancestor or same folder should not be acceptable
    expect(
      cp.getAcceptableDropType({
        type: 'folder',
        folder: cp.getFolderWithPath('/test/f2/'),
        targetFolder: cp.getFolderWithPath('/test/f2/f1/')
      })
    ).toBe(false);

    expect(
      cp.getAcceptableDropType({
        type: 'folder',
        folder: cp.getFolderWithPath('/test/f2/'),
        targetFolder: cp.getFolderWithPath('/test/f2/')
      })
    ).toBe(false);
  });

  it('can make correct drops of components', function () {
    // Can move into a new folder
    expect(
      cp.getAcceptableDropType({
        type: 'component',
        folder: cp.getFolderWithPath('/'),
        component: p1.getComponentWithName('/b'),
        targetFolder: cp.getFolderWithPath('/test/f2/')
      })
    ).toBe('component');

    // Cannot drop to same folder
    expect(
      cp.getAcceptableDropType({
        type: 'component',
        folder: cp.getFolderWithPath('/'),
        component: p1.getComponentWithName('/b'),
        targetFolder: cp.getFolderWithPath('/')
      })
    ).toBe(false);

    // Make the drop
    cp.dropOn({
      type: 'component',
      folder: cp.getFolderWithPath('/'),
      component: p1.getComponentWithName('/b'),
      targetFolder: cp.getFolderWithPath('/test/f2/')
    });

    expect(p1.getComponentWithName('/test/f2/b')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/').hasComponentWithName('b')).toBe(false);
    expect(cp.getFolderWithPath('/test/f2/').hasComponentWithName('b')).toBe(true);
    expect(p1.getComponentWithName('/b')).toBe(undefined);
  });

  //TODO: empty folders are removed when moved, but the undo function does not restore them. This is a bug.
  xit('can drop empty folders', function () {
    cp.performAdd({
      type: 'folder',
      name: 'empty_folder',
      parentFolder: cp.getFolderWithPath('/')
    });

    expect(cp.getFolderWithPath('/empty_folder/')).not.toBe(undefined);

    // Drop empty folder
    cp.dropOn({
      type: 'folder',
      folder: cp.getFolderWithPath('/empty_folder/'),
      targetFolder: cp.getFolderWithPath('/test/')
    });

    expect(cp.getFolderWithPath('/empty_folder/')).toBe(undefined);
    //empty folders are removed when moved
    expect(cp.getFolderWithPath('/test/empty_folder/')).toBe(undefined);

    UndoQueue.instance.undo();

    expect(cp.getFolderWithPath('/empty_folder/')).not.toBe(undefined);
    //  expect(cp.getFolderWithPath('/test/empty_folder/')).toBe(undefined);
  });

  it('can undo add/delete/rename component and folder', function () {
    // Add component
    expect(
      cp.performAdd({
        type: 'component',
        name: 'undome',
        parentPath: '/'
      }).success
    ).toBe(true);

    expect(p1.getComponentWithName('/undome')).not.toBe(undefined);
    expect(UndoQueue.instance.undo().label).toBe('add component');
    expect(p1.getComponentWithName('/undome')).toBe(undefined);

    // Add folder
    expect(
      cp.performAdd({
        type: 'folder',
        name: 'undome',
        parentPath: '/'
      }).success
    ).toBe(true);

    expect(cp.getFolderWithPath('/undome/')).not.toBe(undefined);
    expect(UndoQueue.instance.undo().label).toBe('add folder');
    expect(cp.getFolderWithPath('/undome/')).toBe(undefined);

    // Delete component
    expect(
      cp.performDelete({
        type: 'component',
        folder: cp.getFolderWithPath('/delete_folder/'),
        component: p1.getComponentWithName('/delete_folder/delete_comp')
      }).success
    ).toBe(true);

    expect(p1.getComponentWithName('/delete_folder/delete_comp')).toBe(undefined);
    expect(UndoQueue.instance.undo().label).toBe('delete component');
    expect(p1.getComponentWithName('/delete_folder/delete_comp')).not.toBe(undefined);
    expect(UndoQueue.instance.redo().label).toBe('delete component'); // Folder must be empty for next test to run

    // Delete folder
    expect(
      cp.performDelete({
        type: 'folder',
        folder: cp.getFolderWithPath('/delete_folder/')
      }).success
    ).toBe(true);

    expect(cp.getFolderWithPath('/delete_folder/')).toBe(undefined);
    expect(UndoQueue.instance.undo().label).toBe('delete folder');
    expect(cp.getFolderWithPath('/delete_folder/')).not.toBe(undefined);

    // Rename component
    expect(
      cp.performRename({
        type: 'component',
        name: 'newname',
        folder: cp.getFolderWithPath('/rename_folder/'),
        component: p1.getComponentWithName('/rename_folder/rename_comp')
      }).success
    ).toBe(true);

    expect(p1.getComponentWithName('/rename_folder/newname')).not.toBe(undefined);
    expect(p1.getComponentWithName('/rename_folder/rename_comp')).toBe(undefined);
    expect(UndoQueue.instance.undo().label).toBe('rename component');
    expect(p1.getComponentWithName('/rename_folder/newname')).toBe(undefined);
    expect(p1.getComponentWithName('/rename_folder/rename_comp')).not.toBe(undefined);

    // Rename folder
    expect(
      cp.performRename({
        type: 'folder',
        name: 'newname',
        folder: cp.getFolderWithPath('/rename_folder/')
      }).success
    ).toBe(true);

    expect(p1.getComponentWithName('/newname/rename_comp')).not.toBe(undefined);
    expect(p1.getComponentWithName('/rename_folder/rename_comp')).toBe(undefined);
    expect(cp.getFolderWithPath('/rename_folder/')).toBe(undefined);
    expect(cp.getFolderWithPath('/newname/')).not.toBe(undefined);
    expect(UndoQueue.instance.undo().label).toBe('rename folder');
    expect(p1.getComponentWithName('/newname/rename_comp')).toBe(undefined);
    expect(p1.getComponentWithName('/rename_folder/rename_comp')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/rename_folder/')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/newname/')).toBe(undefined);
  });

  it('can undo drop on folder', function () {
    // Component on folder
    cp.dropOn({
      type: 'component',
      folder: cp.getFolderWithPath('/'),
      component: p1.getComponentWithName('/dropundo'),
      targetFolder: cp.getFolderWithPath('/drop/')
    });

    expect(p1.getComponentWithName('/drop/dropundo')).not.toBe(undefined);
    expect(UndoQueue.instance.undo().label).toBe('move component to folder');
    //  expect(p1.getComponentWithName('/drop/dropundo')).toBe(undefined);
    expect(p1.getComponentWithName('/dropundo')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/drop/').hasComponentWithName('dropundo')).toBe(false);

    // Folder on folder
    cp.dropOn({
      type: 'folder',
      folder: cp.getFolderWithPath('/drop/'),
      targetFolder: cp.getFolderWithPath('/drop2/')
    });
    expect(cp.getFolderWithPath('/drop2/drop/')).not.toBe(undefined);
    expect(UndoQueue.instance.undo().label).toBe('move folder to folder');
    //    expect(cp.getFolderWithPath('/drop2/drop/')).toBe(undefined);
  });

  it('can make correct drops of nested folders and undo', function () {
    cp.dropOn({
      type: 'folder',
      folder: cp.getFolderWithPath('/nested-dropme/'),
      targetFolder: cp.getFolderWithPath('/nested-target/')
    });
    expect(cp.getFolderWithPath('/nested-target/nested-dropme/')).not.toBe(undefined);
    expect(p1.getComponentWithName('/nested-target/nested-dropme/test/b')).not.toBe(undefined);
    expect(p1.getComponentWithName('/nested-dropme/test/b')).toBe(undefined);
    //  expect(cp.getFolderWithPath('/nested-dropme/')).toBe(undefined);
    UndoQueue.instance.undo();
    // expect(cp.getFolderWithPath('/nested-target/nested-dropme/')).toBe(undefined);
    expect(p1.getComponentWithName('/nested-target/nested-dropme/test/b')).toBe(undefined);
    expect(p1.getComponentWithName('/nested-dropme/test/b')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/nested-dropme/')).not.toBe(undefined);
  });

  it('can delete folder with content', function () {
    // Delete folder
    expect(
      cp.performDelete({
        type: 'folder',
        folder: cp.getFolderWithPath('/delete-me/')
      }).success
    ).toBe(true);

    expect(cp.getFolderWithPath('/delete-me/')).toBe(undefined);
    expect(cp.getFolderWithPath('/delete-me/with-content/')).toBe(undefined);
    expect(p1.getComponentWithName('/delete-me/with-content/a')).toBe(undefined);
    expect(p1.getComponentWithName('/delete-me/b')).toBe(undefined);
    UndoQueue.instance.undo();
    expect(cp.getFolderWithPath('/delete-me/')).not.toBe(undefined);
    expect(cp.getFolderWithPath('/delete-me/with-content/')).not.toBe(undefined);
    expect(p1.getComponentWithName('/delete-me/with-content/a')).not.toBe(undefined);
    expect(p1.getComponentWithName('/delete-me/b')).not.toBe(undefined);
  });
});
