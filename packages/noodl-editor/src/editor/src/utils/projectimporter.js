const _ = require('underscore');
const { ProjectModel } = require('@noodl-models/projectmodel');
const { projectFromDirectory } = require('@noodl-models/projectmodel.editor');
const FileSystem = require('./filesystem');

var ProjectImporter = function () {};

// This function lists all components, resources, modules, styles and variants
// And figure out dependencies for component and variants
ProjectImporter.prototype.listComponentsAndDependencies = function (direntry, callback) {
  projectFromDirectory(direntry, function (importProject) {
    if (!importProject) {
      callback();
      return;
    }

    // Collect all component dependencies for this component
    function collectDependencies(c) {
      var deps = [];
      c.forEachNode(function (n) {
        if (n.type.fullName.indexOf('/') === 0) {
          deps.push(n.type.fullName);
        }
      });
      return deps;
    }

    // Collect all file dependencies for a component
    var filePathMap = {};
    function _collectFileDependencies(parameters, deps) {
      for (var i in parameters) {
        var value = parameters[i];
        if (typeof value === 'string' && filePathMap[value]) {
          // We have a possible match, add as file dependency
          deps[value] = true;
        }
      }
    }

    function collectFileDependencies(c) {
      var deps = {};
      c.forEachNode(function (n) {
        // Check if any of the parameters contain file references
        _collectFileDependencies(n.parameters, deps);
        if (n.stateParameters)
          for (let state in n.stateParameters) {
            _collectFileDependencies(n.stateParameters[state], deps);
          }
      });
      return Object.keys(deps);
    }

    // Collect all variant dependencies for a component
    function collectVariantDependencies(c) {
      var deps = {};
      c.forEachNode(function (n) {
        if (n.variantName) {
          deps[n.type.localName + '/' + n.variantName] = { typename: n.type.localName, name: n.variantName };
        }
      });
      return Object.keys(deps).map((dep) => deps[dep]);
    }

    // Collect all style dependencies
    function _getColorStyle(name) {
      if (
        importProject.metadata !== undefined &&
        importProject.metadata.styles !== undefined &&
        importProject.metadata.styles.colors !== undefined
      )
        return importProject.metadata.styles.colors[name];
    }

    function _getTextStyle(name) {
      if (
        importProject.metadata !== undefined &&
        importProject.metadata.styles !== undefined &&
        importProject.metadata.styles.text !== undefined
      )
        return importProject.metadata.styles.text[name];
    }

    function _collectStyleDependencies(parameters, deps) {
      for (var key in parameters) {
        const value = parameters[key];
        if (typeof value === 'string') {
          if (_getColorStyle(value) !== undefined) {
            // This is a color style reference
            deps.colors[value] = true;
          } else if (_getTextStyle(value) !== undefined) {
            deps.text[value] = true;
          }
        }
      }
    }

    function collectStyleDependencies(c) {
      var deps = { text: {}, colors: {} };
      c.forEachNode(function (n) {
        _collectStyleDependencies(n.parameters, deps);
        if (n.stateParameters)
          for (let state in n.stateParameters) {
            _collectStyleDependencies(n.stateParameters[state], deps);
          }
      });
      return { colors: Object.keys(deps.colors), text: Object.keys(deps.text) };
    }

    // Collect file dependencies for a variant
    function collectVariantFileDependencies(v) {
      var deps = {};

      _collectFileDependencies(v.parameters, deps);
      if (v.stateParameters)
        for (let state in v.stateParameters) {
          _collectFileDependencies(v.stateParameters[state], deps);
        }

      return Object.keys(deps);
    }

    // Collect style dependencies for a variant
    function collectVariantStyleDependencies(v) {
      var deps = { text: {}, colors: {} };

      _collectStyleDependencies(v.parameters, deps);
      if (v.stateParameters)
        for (let state in v.stateParameters) {
          _collectStyleDependencies(v.stateParameters[state], deps);
        }

      return { colors: Object.keys(deps.colors), text: Object.keys(deps.text) };
    }

    // Collect style file dependencies
    function collectStyleFileDependencies(s) {
      var deps = {};

      _collectFileDependencies(s, deps);

      return Object.keys(deps);
    }

    // List all resources in project folder for import
    const ignoreFullPath = [
      `${importProject._retainedProjectDirectory}/.git`,
      `${importProject._retainedProjectDirectory}/__MACOSX`
    ];

    importProject.listFilesInProjectDirectory(
      function (entries) {
        // Create a map of all filenames, and create the resources
        // list
        var resources = [];
        var ignore = ['project.json', '.ds_store', '.gitignore', '.gitattributes', 'readme.md'];
        entries.forEach((e) => {
          if (ignore.indexOf(e.name.toLowerCase()) !== -1) return;
          // Skip all ignore files
          else if (e.fullPath.indexOf('.git') === 0) return;
          // Skip .git
          else if (e.fullPath.startsWith(importProject._retainedProjectDirectory + '/noodl_modules')) return; // Ignore modules

          var localPath = e.fullPath.substring(direntry.length + 1);
          filePathMap[localPath] = true;

          resources.push({ name: localPath });
        });

        // Collect modules
        let modules = [];
        try {
          const _modules = FileSystem.instance.readDirectorySync(direntry + '/noodl_modules');
          modules = _modules
            .filter((m) => FileSystem.instance.fileExistsSync(m.fullPath + '/manifest.json'))
            .map((m) => ({ name: m.name }));
        } catch (e) {}

        // Return array with components and dependencies
        var componentsToImport = [];
        importProject.forEachComponent(function (importComponent) {
          componentsToImport.push({
            name: importComponent.fullName,
            dependencies: collectDependencies(importComponent),
            fileDependencies: collectFileDependencies(importComponent),
            variantDependencies: collectVariantDependencies(importComponent),
            styleDependencies: collectStyleDependencies(importComponent)
          });
        });

        // List all styles
        var styles = { colors: [], text: [] };
        if (importProject.metadata !== undefined && importProject.metadata.styles !== undefined) {
          if (importProject.metadata.styles.colors !== undefined) {
            styles.colors = Object.keys(importProject.metadata.styles.colors).map((s) => ({
              name: s
            }));
          }

          if (importProject.metadata.styles.text !== undefined) {
            styles.text = Object.keys(importProject.metadata.styles.text).map((s) => ({
              name: s,
              fileDependencies: collectStyleFileDependencies(importProject.metadata.styles.text[s])
            }));
          }
        }

        // List all variants
        var variants = [];
        if (importProject.variants !== undefined) {
          importProject.variants.forEach((v) => {
            if (v.name !== undefined) {
              variants.push({
                name: v.name,
                typename: v.typename,
                fileDependencies: collectVariantFileDependencies(v),
                styleDependencies: collectVariantStyleDependencies(v)
              });
            }
          });
        }

        callback({ components: componentsToImport, resources, modules, styles, variants });
      },
      undefined,
      ignoreFullPath
    );
  });
};

ProjectImporter.prototype.hasCollisions = function (c) {
  return (
    (c.resources !== undefined && c.resources.length > 0) ||
    (c.components !== undefined && c.components.length > 0) ||
    (c.variants !== undefined && c.variants.length > 0) ||
    (c.modules !== undefined && c.modules.length > 0) ||
    (c.styles !== undefined && c.styles.colors !== undefined && c.styles.colors.length > 0) ||
    (c.styles !== undefined && c.styles.text !== undefined && c.styles.text.length > 0)
  );
};

// This function checks for collisions with the current project model instance
ProjectImporter.prototype.checkForCollisions = function (imports, callback) {
  if (!ProjectModel.instance) {
    callback({ result: 'failure', message: 'No project loaded, cannot import.' });
    return;
  }

  // Check for component collisions
  var collisions = { resources: [], components: [], styles: { text: [], colors: [] }, variants: [], modules: [] };
  imports.components &&
    _.each(imports.components, function (c) {
      var component = ProjectModel.instance.getComponentWithName(c.name);
      if (component) collisions.components.push(c);
    });

  // Check style collisions
  const styles = ProjectModel.instance.getMetaData('styles');
  if (styles !== undefined) {
    // Check color styles
    if (styles.colors !== undefined && imports.styles.colors !== undefined) {
      imports.styles.colors.forEach((c) => {
        if (styles.colors[c.name] !== undefined) collisions.styles.colors.push(c);
      });
    }

    // Check text styles
    if (styles.text !== undefined && imports.styles.text !== undefined) {
      imports.styles.text.forEach((t) => {
        if (styles.text[t.name] !== undefined) collisions.styles.text.push(t);
      });
    }
  }

  // Check variant collisions
  if (imports.variants !== undefined) {
    imports.variants.forEach((v) => {
      if (ProjectModel.instance.findVariant(v.name, { localName: v.typename }) !== undefined) {
        collisions.variants.push(v);
      }
    });
  }

  // No resources of modules to import, return now
  if (
    (imports.resources === undefined || imports.resources.length === 0) &&
    (imports.modules === undefined || imports.modules.length === 0)
  ) {
    callback(this.hasCollisions(collisions) ? collisions : undefined);
    return;
  }

  ProjectModel.instance.listFilesInProjectDirectory((projectFiles) => {
    // Create map of all project files
    var filePathMap = {};
    projectFiles.forEach((e) => {
      var localPath = e.fullPath.substring(ProjectModel.instance._retainedProjectDirectory.length + 1);
      filePathMap[localPath] = true;
    });

    // Check for collisions and return result
    imports.resources.forEach((f) => {
      if (filePathMap[f.name]) collisions.resources.push(f);
    });

    // Check for module collisions
    let modules = [];
    try {
      const _modules = FileSystem.instance.readDirectorySync(
        ProjectModel.instance._retainedProjectDirectory + '/noodl_modules'
      );
      modules = _modules
        .filter((m) => FileSystem.instance.fileExistsSync(m.fullPath + '/manifest.json'))
        .map((m) => ({ name: m.name }));
    } catch (e) {}

    if (modules.length > 0) {
      imports.modules.forEach((m) => {
        if (modules.find((_m) => _m.name === m.name) !== undefined) {
          collisions.modules.push(m);
        }
      });
    }

    callback(this.hasCollisions(collisions) ? collisions : undefined);
  });
};

ProjectImporter.prototype.importResources = function (direntry, imports, callback, options) {
  const project = options && options.importIntoProject ? options.importIntoProject : ProjectModel.instance;

  // Callback when a file is processed
  var resourcesLeft = 0;
  var failedFiles = 0;
  function fileCompleted(success) {
    if (!success) failedFiles++;

    resourcesLeft--;
    if (resourcesLeft === 0) {
      if (failedFiles) callback({ result: 'failure', message: 'Not all files could be copied' });
      else callback({ result: 'success' });
    }
  }

  if (imports.resources.length === 0) {
    callback({ result: 'success' });
    return;
  }

  // Loop over all resources and copy them, create folders
  // if necessary
  _.each(imports.resources, function (r) {
    resourcesLeft++;
    var folders = r.name.split('/');
    folders.pop(); // Remove last entry (filename)
    FileSystem.instance.makeDirectory(project._retainedProjectDirectory + '/' + folders.join('/'), function (res) {
      if (res.result === 'failure') fileCompleted(false);
      else {
        project.copyFileToProjectDirectory({ fullPath: direntry + '/' + r.name, name: r.name }, function (res) {
          fileCompleted(res.result === 'success');
        });
      }
    });
  });
};

ProjectImporter.prototype.import = function (direntry, imports, callback, options) {
  var _this = this;

  const project = options && options.importIntoProject ? options.importIntoProject : ProjectModel.instance;

  if (!project) {
    callback({ result: 'failure', message: 'No project loaded, cannot import.' });
    return;
  }

  projectFromDirectory(direntry, function (importProject) {
    if (!importProject) {
      callback({ result: 'failure', message: 'Could not open project to import' });
      return;
    }

    // Add components to import to project
    imports.components &&
      _.each(imports.components, function (c) {
        var importComponent = importProject.getComponentWithName(c.name);
        importProject.removeComponent(importComponent);

        delete importComponent.id; // re-key below will create a new id
        importComponent.rekeyAllIds();

        var component = project.getComponentWithName(c.name);
        if(component) {
          project.removeComponent(component)
          // Component exist in project, it should be overwritten
          importComponent.id = component.id;
        }

        project.addComponent(importComponent);
      });

    // Merge styles
    if (imports.styles !== undefined) {
      const importStyles = importProject.getMetaData('styles');
      const styles = { text: {}, colors: {} };

      if (imports.styles.colors !== undefined) {
        imports.styles.colors.forEach((c) => {
          styles.colors[c.name] = importStyles.colors[c.name];
        });
      }

      if (imports.styles.text !== undefined) {
        imports.styles.text.forEach((c) => {
          styles.text[c.name] = importStyles.text[c.name];
        });
      }
      project.mergeMetadata({ styles });
    }

    // Add variants
    if (imports.variants !== undefined) {
      imports.variants.forEach((v) => {
        const importVariant = importProject.findVariant(v.name, { localName: v.typename });
        importProject.deleteVariant(importVariant);

        const variant = project.findVariant(v.name, { localName: v.typename });
        if (variant !== undefined) project.deleteVariant(variant);
        project.addVariant(importVariant);
      });
    }

    // If no resources or packages to import, we are done
    if ((!imports.resources || imports.resources.length === 0) && (!imports.modules || imports.modules.length === 0)) {
      callback({ result: 'success' });
      return;
    }

    // Import resources
    _this.importResources(
      direntry,
      imports,
      function (r) {
        if (r.result !== 'success') {
          callback(r);
          return;
        }

        // Import modules
        if (imports.modules !== undefined) {
          imports.modules.forEach((m) => {
            FileSystem.instance.copyRecursiveSync(
              importProject._retainedProjectDirectory + '/noodl_modules/' + m.name,
              project._retainedProjectDirectory + '/noodl_modules/' + m.name
            );
          });
        }

        callback({ result: 'success' });
      },
      options
    );
  });
};

ProjectImporter.prototype.filterImports = function (imports, filter) {
  if (filter.remove) {
    if (filter.remove.components !== undefined && filter.remove.components.length > 0)
      imports.components = imports.components.filter((c) => !filter.remove.components.find((_c) => _c.name == c.name));

    if (filter.remove.resources !== undefined && filter.remove.resources.length > 0)
      imports.resources = imports.resources.filter((c) => !filter.remove.resources.find((_c) => _c.name == c.name));

    if (filter.remove.modules !== undefined && filter.remove.modules.length > 0)
      imports.modules = imports.modules.filter((c) => !filter.remove.modules.find((_c) => _c.name == c.name));

    if (filter.remove.variants !== undefined && filter.remove.variants.length > 0)
      imports.variants = imports.variants.filter(
        (c) => !filter.remove.variants.find((_c) => _c.name == c.name && _c.typename === c.typename)
      );

    if (
      filter.remove.styles !== undefined &&
      filter.remove.styles.colors !== undefined &&
      filter.remove.styles.colors.length > 0
    )
      imports.styles.colors = imports.styles.colors.filter(
        (c) => !filter.remove.styles.colors.find((_c) => _c.name == c.name)
      );

    if (
      filter.remove.styles !== undefined &&
      filter.remove.styles.text !== undefined &&
      filter.remove.styles.text.length > 0
    )
      imports.styles.text = imports.styles.text.filter(
        (c) => !filter.remove.styles.text.find((_c) => _c.name == c.name)
      );
  }
};

ProjectImporter.instance = new ProjectImporter();

module.exports = ProjectImporter;
