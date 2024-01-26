const EventSender = require('./eventsender');

describe('EventSender', ()=> {

    let eventSender;

    beforeEach(()=>{
        eventSender = new EventSender();
    });

    it('can send events', ()=> {

        const mockCallback = jest.fn(() => {});

        eventSender.on('testEvent', mockCallback);

        const someArgument = {lol:'troll'};
        eventSender.emit('testEvent', someArgument);

        expect(mockCallback.mock.calls.length).toBe(1);
        expect(mockCallback.mock.calls[0][0]).toBe(someArgument);
    });

    it('can remove a listener', ()=> {
        const mockCallback = jest.fn(() => {});
        const mockCallback2 = jest.fn(() => {});

        const ref = {};
        const ref2 = {};

        eventSender.on('testEvent', mockCallback, ref);
        eventSender.on('testEvent', mockCallback2, ref2);

        eventSender.removeListenersWithRef(ref);
        eventSender.emit('testEvent');

        expect(mockCallback.mock.calls.length).toBe(0);
        expect(mockCallback2.mock.calls.length).toBe(1);

    });

    it('can remove all listeners', ()=> {
        const mockCallback = jest.fn(() => {});
        const mockCallback2 = jest.fn(() => {});

        const ref = {};
        const ref2 = {};

        eventSender.on('testEvent', mockCallback, ref);
        eventSender.on('testEvent2', mockCallback2, ref2);

        eventSender.removeAllListeners('testEvent');
        eventSender.emit('testEvent');
        eventSender.emit('testEvent2');

        expect(mockCallback.mock.calls.length).toBe(0);
        expect(mockCallback2.mock.calls.length).toBe(1);

    });

});
