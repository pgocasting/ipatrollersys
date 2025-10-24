const isDev = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args) => isDev && false && console.log(...args), // disabled
  error: (...args) => isDev && console.error(...args),
};
