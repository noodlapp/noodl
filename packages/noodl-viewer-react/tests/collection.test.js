const Collection = require('../src/nodes/std-library/data/collection');

//Collection.set is "smart" and is doing an delta update
//TODO: check that the correct events are sent
test('collection.set - add', async () => {
  
    const a = new Collection.create([{id: 1}, {id: 2}]);
    const b = new Collection.create([{id: 1}, {id: 2}, {id: 3}]);

    a.set(b);

    expect(a.items).toEqual(b.items);
});

test('collection.set - remove', async () => {
  
    const a = new Collection.create([{id: 1}, {id: 2}, {id: 3}]);
    const b = new Collection.create([{id: 1}, {id: 3}]);

    await a.set(b);

    expect(a.items).toEqual(b.items);
});

test('collection.set - reorder', async () => {
  
    const a = new Collection.create([{id: 1}, {id: 2}, {id: 3}]);
    const b = new Collection.create([{id: 3}, {id: 1}, {id: 2}]);

    await a.set(b);

    expect(a.items).toEqual(b.items);
});