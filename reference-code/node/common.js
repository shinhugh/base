const wrapError = (e, message) => {
  const error = new Error(message);
  if (Object.hasOwn(e, 'inner')) {
    error.inner = e.inner;
  }
  else {
    error.inner = e;
  }
  return error;
};

export {
  wrapError
};
