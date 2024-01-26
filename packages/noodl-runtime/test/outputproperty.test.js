const OutputProperty = require('./outputproperty');

test('Throws an exception if no owner is specified', () => {
    expect(()=>{
        new OutputProperty();
    }).toThrow(Error);
});
