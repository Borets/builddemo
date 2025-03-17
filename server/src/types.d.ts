// This file provides fallback type declarations for modules that might be missing their type definitions

declare module 'pg' {
  export const Pool: any;
  export const Client: any;
}

declare module 'cors' {
  function cors(options?: any): any;
  export default cors;
}

declare module 'morgan' {
  function morgan(format: string, options?: any): any;
  export default morgan;
} 