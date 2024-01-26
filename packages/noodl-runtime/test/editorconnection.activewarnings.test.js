const ActiveWarnings = require('./editorconnection.activewarnings');

describe('Tracks active warnings that are sent to the editor', ()=>{
    let activeWarnings;

    beforeEach(async ()=>{
        activeWarnings = new ActiveWarnings();
    });


    test('Set and clear a warning', () => {
        expect(activeWarnings.setWarning('testId', 'testKey', 'testWarning')).toBe(true);

        //these warnings shouldnt exist
        expect(activeWarnings.clearWarning('testId', 'otherKey')).toEqual(false);
        expect(activeWarnings.clearWarning('otherId', 'testKey')).toEqual(false);
        
        //this warning is the one we set
        expect(activeWarnings.clearWarning('testId', 'testKey')).toEqual(true);

        //and now the warning should be gone
        expect(activeWarnings.clearWarning('testId', 'testKey')).toEqual(false);
    });

    test('Set and clear multiple warning on one node', () => {
        expect(activeWarnings.setWarning('testId', 'testKey1', 'testWarning')).toBe(true);
        expect(activeWarnings.setWarning('testId', 'testKey2', 'testWarning')).toBe(true);

        expect(activeWarnings.clearWarning('testId', 'testKey1')).toEqual(true);
        expect(activeWarnings.clearWarning('testId', 'testKey1')).toEqual(false);

        expect(activeWarnings.clearWarning('testId', 'testKey2')).toEqual(true);
        expect(activeWarnings.clearWarning('testId', 'testKey2')).toEqual(false);
    });

    test('Clear multiple warnings at once', () => {
        expect(activeWarnings.setWarning('testId1', 'testKey1', 'testWarning')).toBe(true);
        expect(activeWarnings.setWarning('testId1', 'testKey2', 'testWarning')).toBe(true);
        expect(activeWarnings.setWarning('testId2', 'testKey1', 'testWarning')).toBe(true);

        expect(activeWarnings.clearWarnings('testId3')).toEqual(false);

        expect(activeWarnings.clearWarnings('testId1')).toEqual(true);
        expect(activeWarnings.clearWarnings('testId1')).toEqual(false);

        expect(activeWarnings.clearWarnings('testId2')).toEqual(true);
        expect(activeWarnings.clearWarnings('testId2')).toEqual(false);
    });

    test('Set same warning multiple times', () => {
        expect(activeWarnings.setWarning('testId', 'testKey', 'testWarning')).toBe(true);
        expect(activeWarnings.setWarning('testId', 'testKey', 'testWarning')).toBe(false);
        expect(activeWarnings.setWarning('testId', 'testKey', 'testWarning2')).toBe(true);
    });
});
