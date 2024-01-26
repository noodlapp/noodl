"use strict";

function createSetter(args) {

    var currentValue = false;

    return function(value) {
        value = value ? true : false;
        //value changed from false to true
        if(value && currentValue === false) {
            args.valueChangedToTrue.call(this);
        }
        currentValue = value;
    };
}

module.exports = {
    createSetter: createSetter
};