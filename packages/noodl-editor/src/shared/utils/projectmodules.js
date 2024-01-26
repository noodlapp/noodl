const fs = require('fs');

class ProjectModules {
  constructor() {}
  scanProjectModules(projectDirectory, callback) {
    if (projectDirectory === undefined) {
      callback(); // No project directory, no modules
      return;
    }

    var modulesPath = projectDirectory + '/noodl_modules';
    fs.readdir(modulesPath, function (err, files) {
      if (err) {
        callback();
        return;
      }

      //we only care about directories
      const directories = files.filter((f) => {
        var stats = fs.lstatSync(modulesPath + '/' + f);
        return stats.isDirectory() || stats.isSymbolicLink();
      });

      if (directories.length === 0) {
        callback();
      } else {
        // For each subfolder in noodl_modules
        var modules = [];
        var modulesLeft = 0;

        function completeModule(path, manifest) {
          if (path && manifest) {
            // Module manifest is fetched, resolve local paths
            var m = {
              dependencies: [],
              browser: manifest.browser,
              runtimes: manifest.runtimes || ['browser'] //default to browser
            };

            if (manifest.main) {
              m.index = path + '/' + manifest.main;
            }

            if (manifest.dependencies) {
              for (var j = 0; j < manifest.dependencies.length; j++) {
                var d = manifest.dependencies[j];
                if (!d.startsWith['http']) d = path + '/' + d;

                m.dependencies.push(d);
              }
            }

            modules.push(m);
          }

          modulesLeft--;
          if (modulesLeft === 0) {
            //sort modules so the order is deterministics
            //helps the editor understand when node libraries change, or are the same
            const modulesWithIndexFile = modules.filter((m) => m.index);
            const modulesWithoutIndexFile = modules.filter((m) => !m.index);

            modulesWithIndexFile.sort((a, b) => a.index.localeCompare(b.index));

            callback(modulesWithIndexFile.concat(modulesWithoutIndexFile));
          }
        }

        for (var i = 0; i < directories.length; i++) {
          const dir = directories[i];
          modulesLeft++;
          // Read manifest
          fs.readFile(
            modulesPath + '/' + dir + '/manifest.json',
            'utf8',
            (function () {
              const _dir = dir;
              return function (err, data) {
                if (err) {
                  completeModule(); // Module load failed
                  return;
                }

                try {
                  completeModule('noodl_modules/' + _dir, JSON.parse(data));
                } catch (e) {
                  // JSON not valid
                  completeModule(); // Module load failed
                }
              };
            })()
          );
        }
      }
    });
  }
  injectIntoHtml(projectDirectory, template, pathPrefix, callback) {
    this.scanProjectModules(projectDirectory, function (modules) {
      var dependencies = '';
      var modulesMain = '';
      if (modules) {
        const browserModules = modules.filter((m) => m.runtimes.indexOf('browser') !== -1);
        for (var i = 0; i < browserModules.length; i++) {
          var m = browserModules[i];
          if (m.index) {
            modulesMain += '<script type="text/javascript" src="' + pathPrefix + m.index + '"></script>\n';
          }

          // Module javascript dependencies
          if (m.dependencies) {
            for (var j = 0; j < m.dependencies.length; j++) {
              var d = m.dependencies[j];
              var dTag = '<script type="text/javascript" src="' + pathPrefix + d + '"></script>\n';
              if (dependencies.indexOf(dTag) === -1) dependencies += dTag;
            }
          }

          // Browser modules
          if (m.browser) {
            if (m.browser.head) {
              var head = m.browser.head;
              for (var j = 0; j < head.length; j++) {
                dependencies += head[j] + '\n';
              }
            }

            if (m.browser.styles) {
              var styles = m.browser.styles;
              for (var j = 0; j < styles.length; j++) {
                dependencies += '<style>' + styles[j] + '</style>' + '\n';
              }
            }

            if (m.browser.stylesheets) {
              var sheets = m.browser.stylesheets;
              for (var j = 0; j < sheets.length; j++) {
                if (typeof sheets[j] === 'string') {
                  let path = sheets[j];
                  if (!path.startsWith('http')) {
                    path = pathPrefix + path;
                  }

                  dependencies += '<link href="' + path + '" rel="stylesheet">';
                }
              }
            }
          }
        }
      }

      var injected = template.replace('<%modules_dependencies%>', dependencies);
      injected = injected.replace('<%modules_main%>', modulesMain);

      callback(injected);
    });
  }
}

ProjectModules.instance = new ProjectModules();

module.exports = ProjectModules;
