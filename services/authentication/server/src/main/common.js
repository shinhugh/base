const wrapAndThrowError = (e, message) => {
  const error = new Error(message);
  if (Object.hasOwn(e, 'inner')) {
    error.inner = e.inner;
  }
  else {
    error.inner = e;
  }
  throw error;
};

export {
  wrapAndThrowError
};
