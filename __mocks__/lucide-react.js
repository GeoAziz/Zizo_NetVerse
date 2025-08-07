module.exports = new Proxy(
  {},
  {
    get: (target, prop) => () => null,
  }
);