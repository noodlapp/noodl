async function asyncPool(poolLimit, values, iteratorFn) {
    const ret = [];
    const executing = [];
    for (const item of values) {
      const p = Promise.resolve().then(() => iteratorFn(item, values));
      ret.push(p);
  
      if (poolLimit <= values.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= poolLimit) {
          await Promise.race(executing);
        }
      }
    }
    
    return Promise.all(ret);
  }
  
  module.exports = asyncPool;