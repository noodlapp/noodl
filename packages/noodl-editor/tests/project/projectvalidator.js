var ProjectValidator = require('@noodl-utils/projectvalidator');

// Project settings
describe('Project validator', function () {
  it('can validate missing components', function () {
    const proj = {};

    const validator = new ProjectValidator();
    validator.validate(proj);
    expect(validator.hasErrors()).toBe(true);
    expect(validator.errors[0].msg).toBe('Project is missing name');
    expect(validator.errors[1].msg).toBe('Project is missing components');
  });

  it('can validate dangling connections and fix', function () {
    const proj = {
      name: 'C',
      components: [
        {
          name: 'A',
          graph: {
            roots: [],
            connections: [
              {
                fromId: 'a',
                fromProperty: 'hej',
                toId: 'b',
                toProperty: 'hej'
              }
            ]
          }
        }
      ]
    };

    const validator = new ProjectValidator();
    validator.validate(proj);
    expect(validator.hasErrors()).toBe(true);
    expect(validator.errors[0].msg).toBe('Dangling connection at A missing source missing target ');

    validator.fix();
    validator.clearErrors();
    validator.validate(proj);
    expect(validator.hasErrors()).toBe(false);
    expect(proj.components[0].graph.connections.length).toBe(0);
  });
});
