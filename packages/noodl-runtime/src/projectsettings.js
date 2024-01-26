"use strict";

function addModuleSettings(result, modules) {
    // Add module settings
    for(var i = 0; i < modules.length; i++) {
        var m = modules[i];
        if(m.settings) {
            m.settings.forEach(function(p) {
                result.ports.push(p);
            })
        }
    }
}

function generateProjectSettings(projectSettings, modules) {
    const result = {
        dynamicports: [],
        ports: []
    };

    addModuleSettings(result, modules);

    return result;
}

module.exports = {
    generateProjectSettings: generateProjectSettings
};