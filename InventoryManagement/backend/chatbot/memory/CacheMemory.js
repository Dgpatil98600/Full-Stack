const cache = {};
const TTL = 60 * 60 * 1000; // 5 min

function getCache(key) {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() - item.time > TTL) {
    delete cache[key];
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cache[key] = { data, time: Date.now() };
}

export { getCache, setCache };
