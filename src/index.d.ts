
export interface Options {
  KeyWord?: string;
  fileDir?: string;
  comKey?: string;
  outputFile?: string;
  exts?: string[];
  routerVar?: string;
  isLazy?: boolean;
}


declare const ReactRouterGenerator: (options?: Options) => Plugin;
export default ReactRouterGenerator;
