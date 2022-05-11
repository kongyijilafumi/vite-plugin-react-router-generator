
export interface Options {
  outputFile?: string;
  fileDir?: string;
  comKey?: string;
  KeyWord?: string;
  routerVar?: string;
  exts?: string[];
  isLazy?: boolean;
  insertBeforeStr?: string;
  insertAfterStr?: string;
}


declare const ReactRouterGenerator: (options?: Options) => Plugin;
export default ReactRouterGenerator;
