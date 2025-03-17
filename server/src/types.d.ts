// This file provides fallback type declarations for modules that might be missing their type definitions

declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    connect(): Promise<PoolClient>;
    query(text: string, params?: any[]): Promise<QueryResult>;
    end(): Promise<void>;
  }
  
  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query(text: string, params?: any[]): Promise<QueryResult>;
    end(): Promise<void>;
  }
  
  export interface PoolClient {
    query(text: string, params?: any[]): Promise<QueryResult>;
    release(err?: Error): void;
  }
  
  export interface QueryResult {
    rows: any[];
    rowCount: number;
    command: string;
    oid: number;
    fields: any[];
  }
}

declare module 'cors' {
  function cors(options?: any): any;
  export default cors;
}

declare module 'morgan' {
  function morgan(format: string, options?: any): any;
  export default morgan;
} 