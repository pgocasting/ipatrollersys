const isDev = !!import.meta.env?.DEV;

export const logger = {
  log: (...args) => isDev && false && console.log(...args), // disabled
  error: (...args) => isDev && console.error(...args),
};
