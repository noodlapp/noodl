const ProjectImporter = require('@noodl-utils/projectimporter');
const FileSystem = require('@noodl-utils/filesystem');
const { ProjectModel } = require('@noodl-models/projectmodel');
const Utils = require('@noodl-utils/utils');
const Process = require('process');
const ncp = require('ncp').ncp;
const fs = require('fs');
const { projectFromDirectory } = require('@noodl-models/projectmodel.editor');

const remote = require('@electron/remote');
const App = remote.app;

describe('Project import and export unit tests', function () {
  function expectFilesToExist(direntry, paths, callback) {
    var filesToCheck = paths.length;
    var success = true;

    function done() {
      filesToCheck--;
      if (filesToCheck === 0) callback(success);
    }

    for (var i in paths) {
      FileSystem.instance.fileExists(direntry + '/' + paths[i], function (exists) {
        if (!exists) success = false;
        done();
      });
    }
  }

  it('can import project with styles and variants', function (done) {
    ProjectImporter.instance.listComponentsAndDependencies(
      Process.cwd() + '/tests/testfs/import_proj5',
      function (imports) {
        expect(imports.styles.colors).toEqual([
          {
            name: 'Primary'
          },
          {
            name: 'Light Gray'
          },
          {
            name: 'Dark Gray'
          },
          {
            name: 'Primary Dark'
          },
          {
            name: 'Dark'
          },
          {
            name: 'Primary Light'
          }
        ]);

        expect(imports.styles.text).toEqual([
          {
            name: 'Body Text',
            fileDependencies: ['fonts/Roboto/Roboto-Regular.ttf']
          },
          {
            name: 'Button Label',
            fileDependencies: ['fonts/Roboto/Roboto-Regular.ttf']
          },
          {
            name: 'Label Text',
            fileDependencies: ['fonts/Roboto/Roboto-Regular.ttf']
          }
        ]);

        expect(imports.variants).toEqual([
          {
            name: 'Basic',
            typename: 'net.noodl.controls.button',
            fileDependencies: ['fonts/Roboto/Roboto-Medium.ttf'],
            styleDependencies: {
              colors: ['Primary', 'Primary Light', 'Primary Dark', 'Light Gray'],
              text: ['Button Label']
            }
          },
          {
            name: 'Search Field',
            typename: 'net.noodl.controls.textinput',
            fileDependencies: ['fonts/Roboto/Roboto-Medium.ttf'],
            styleDependencies: {
              colors: ['Light Gray', 'Dark', 'Primary'],
              text: ['Body Text', 'Label Text']
            }
          }
        ]);

        done();
      }
    );
  });

  it('can check for collissions (with styles and variants)', function (done) {
    projectFromDirectory(Process.cwd() + '/tests/testfs/import_proj5', function (project) {
      ProjectModel.instance = project;

      // Now check for collistions with project to import
      ProjectImporter.instance.listComponentsAndDependencies(
        Process.cwd() + '/tests/testfs/import_proj5',
        function (imports) {
          ProjectImporter.instance.checkForCollisions(imports, function (collisions) {
            expect(collisions.components.length).toBe(2);
            expect(collisions.modules.length).toBe(1);
            expect(collisions.resources.length).toBe(13);
            expect(collisions.variants.length).toBe(2);
            expect(collisions.styles.colors.length).toBe(6);
            expect(collisions.styles.text.length).toBe(3);
            done();
          });
        }
      );
    });
  });

  it('can list components and dependencies', function (done) {
    ProjectImporter.instance.listComponentsAndDependencies(
      Process.cwd() + '/tests/testfs/import_proj1',
      function (imports) {
        console.log(imports);
        expect(imports.components).toEqual([
          {
            name: '/comp1',
            dependencies: [],
            fileDependencies: ['assets/bear.jpg'],
            styleDependencies: {
              text: [],
              colors: []
            },
            variantDependencies: []
          },
          {
            name: '/comp2',
            dependencies: [],
            fileDependencies: [],
            styleDependencies: {
              text: [],
              colors: []
            },
            variantDependencies: []
          },
          {
            name: '/Main',
            dependencies: ['/comp1'],
            fileDependencies: ['Fontfabric - Nexa-Bold.otf'],
            styleDependencies: {
              text: [],
              colors: []
            },
            variantDependencies: []
          }
        ]);

        expect(imports.styles).toEqual({
          text: [],
          colors: []
        });

        //the order of these are different on mac and windows, so sort them
        imports.resources.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        expect(imports.resources).toEqual([
          {
            name: 'assets/bear.jpg'
          },
          {
            name: 'assets/bikeyellowbuilding.jpg'
          },
          {
            name: 'bear.jpg'
          },
          {
            name: 'Fontfabric - Nexa-Bold.otf'
          }
        ]);

        expect(imports.variants).toEqual([]);
        expect(imports.modules).toEqual([]);

        done();
      }
    );
  });

  it('can check for collissions (1)', function (done) {
    projectFromDirectory(Process.cwd() + '/tests/testfs/import_proj1', function (project) {
      ProjectModel.instance = project;

      // Now check for collistions with project to import
      ProjectImporter.instance.listComponentsAndDependencies(
        Process.cwd() + '/tests/testfs/import_proj2',
        function (imports) {
          ProjectImporter.instance.checkForCollisions(imports, function (collisions) {
            expect(collisions.components.length).toBe(1);
            expect(collisions.components[0].name).toBe('/Main');

            expect(collisions.resources).toEqual([]);
            expect(collisions.modules).toEqual([]);
            expect(collisions.variants).toEqual([]);
            expect(collisions.styles).toEqual({
              colors: [],
              text: []
            });

            done();
          });
        }
      );
    });
  });

  it('can check for collissions (2)', function (done) {
    projectFromDirectory(Process.cwd() + '/tests/testfs/import_proj1', function (project) {
      ProjectModel.instance = project;

      // Now check for collistions with project to import
      ProjectImporter.instance.listComponentsAndDependencies(
        Process.cwd() + '/tests/testfs/import_proj3',
        function (imports) {
          ProjectImporter.instance.checkForCollisions(imports, function (collisions) {
            expect(collisions.resources).toEqual([
              {
                name: 'Fontfabric - Nexa-Bold.otf'
              },
              {
                name: 'assets/bear.jpg'
              }
            ]);

            expect(collisions.components).toEqual([]);
            expect(collisions.modules).toEqual([]);
            expect(collisions.variants).toEqual([]);
            expect(collisions.styles).toEqual({
              colors: [],
              text: []
            });

            done();
          });
        }
      );
    });
  });

  it('can import project with files', function (done) {
    var tempDir = App.getPath('temp') + '/noodlunittests-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectory(tempDir, function (r) {
      if (r.result !== 'success') {
        throw 'gaah';
      }

      ncp(Process.cwd() + '/tests/testfs/import_proj1', tempDir + '/import_proj1', function (err) {
        if (err) {
          throw err;
        }

        projectFromDirectory(tempDir + '/import_proj1', function (project) {
          ProjectModel.instance = project;

          ProjectImporter.instance.listComponentsAndDependencies(
            Process.cwd() + '/tests/testfs/import_proj3',
            function (imports) {
              ProjectImporter.instance.import(Process.cwd() + '/tests/testfs/import_proj3', imports, function () {
                expect(ProjectModel.instance.getComponentWithName('/Main2')).not.toBe(undefined);

                // Check that files have been copied properly
                expectFilesToExist(
                  tempDir + '/import_proj1',
                  ['assets/bear.jpg', 'Fontfabric - Nexa-Bold.otf', 'newfile.jpg'],
                  function (success) {
                    expect(success).toBe(true);
                    done();
                  }
                );
              });
            }
          );
        });
      });
    });
  });

  it('can import project with styles, variants and modules', function (done) {
    var tempDir = App.getPath('temp') + '/noodlunittests-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectory(tempDir, function (r) {
      if (r.result !== 'success') {
        throw 'gaah';
      }

      ncp(Process.cwd() + '/tests/testfs/import_proj1', tempDir + '/import_proj1', function (err) {
        if (err) {
          throw err;
        }

        projectFromDirectory(tempDir + '/import_proj1', function (project) {
          ProjectModel.instance = project;

          ProjectImporter.instance.listComponentsAndDependencies(
            Process.cwd() + '/tests/testfs/import_proj5',
            function (imports) {
              ProjectImporter.instance.import(Process.cwd() + '/tests/testfs/import_proj5', imports, function () {
                const styles = ProjectModel.instance.getMetaData('styles');
                expect(Object.keys(styles.colors).sort()).toEqual([
                  'Dark',
                  'Dark Gray',
                  'Light Gray',
                  'Primary',
                  'Primary Dark',
                  'Primary Light'
                ]);
                expect(Object.keys(styles.text).sort()).toEqual(['Body Text', 'Button Label', 'Label Text']);

                expect(
                  ProjectModel.instance.findVariant('Basic', {
                    localName: 'net.noodl.controls.button'
                  })
                ).not.toBe(undefined);
                expect(
                  ProjectModel.instance.findVariant('Search Field', {
                    localName: 'net.noodl.controls.textinput'
                  })
                ).not.toBe(undefined);

                expect(fs.existsSync(tempDir + '/import_proj1/noodl_modules/material-icons')).toBe(true);

                done();
              });
            }
          );
        });
      });
    });
  });

  it('ignores .git', function (done) {
    const path = Process.cwd() + '/tests/testfs/import_proj4/';

    //add a .git folder with a file inside
    FileSystem.instance.makeDirectorySync(path + '.git');
    FileSystem.instance.writeFileSync(path + '.git/test', 'test');

    ProjectImporter.instance.listComponentsAndDependencies(path, (imports) => {
      expect(imports.components.length).toBe(1);
      expect(imports.resources.length).toBe(0);

      //remove the .git folder
      FileSystem.instance.removeFileSync(path + '.git/test');
      FileSystem.instance.removeDirectoryRecursiveSync(path + '.git');

      done();
    });
  });
});
