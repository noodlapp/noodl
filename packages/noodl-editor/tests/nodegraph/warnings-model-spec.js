const WarningsModel = require('@noodl-models/warningsmodel').WarningsModel;

describe('Warnings model', function () {
  beforeEach(() => {
    //since warningsmodel is global there can be warnings left over from other tests, make sure to clear them
    WarningsModel.instance.clearAllWarnings();
  });

  it('can remove warnings using a callback for matching', function () {
    WarningsModel.instance.setWarning(
      {
        key: 'test-warning-remove'
      },
      {
        message: 'test warning'
      }
    );
    WarningsModel.instance.setWarning(
      {
        key: 'test-warning'
      },
      {
        message: 'test warning'
      }
    );

    expect(WarningsModel.instance.getTotalNumberOfWarnings()).toBe(2);

    WarningsModel.instance.clearWarningsForRefMatching((ref) => ref.key.includes('remove'));
    expect(WarningsModel.instance.getTotalNumberOfWarnings()).toBe(1);
  });
});
