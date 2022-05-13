# vite-plugin-react-router-generator

A routing list is generated automatically according to the information defined in the file, which is used in vitejs.(路由列表是根据文件中定义的信息自动生成的，用于 vitejs)

## How to use? (如何使用)

To add a dependency to your project, use the following command.(在你的项目添加依赖，使用一下命令)

```bash
D:\your_project> npm i vite-plugin-react-router-generator -D
# or 或者
D:\your_project> cnpm i vite-plugin-react-router-generator -D
# or 或者
D:\your_project> yarn add vite-plugin-react-router-generator -D
```

In your `vite.config.js` plugins configuration, the code is as follows.(在你 vite.config.js 的 plugins 配置中使用,代码如下.)

```js
// vite.config.js
import ReactRouterGenerator from "vite-plugin-react-router-generator";
const options = {
  // ... any porperty
};
export default defineConfig({
  plugins: [ReactRouterGenerator(options)],
});
```

```ts
export interface Options {
  outputFile?: string;
  fileDir?: string;
  comKey?: string;
  keyWord?: string;
  routerVar?: string;
  exts?: string[];
  isLazy?: boolean;
  insertBeforeStr?: string;
  insertAfterStr?: string;
}
declare const ReactRouterGenerator: (options?: Options) => Plugin;
```

## options's porperty(配置属性)

| Property        | Type    | Default                                      | Descript                               |
| --------------- | ------- | -------------------------------------------- | -------------------------------------- |
| fileDir         | String  | path.join(process.cwd(), "./src/pages")      | 需要从哪个文件夹中提取信息。           |
| outputFile      | String  | path.join(process.cwd(), "./src/router.jsx") | 生成路由列表信息的文件路径。           |
| keyWord         | String  | "route"                                      | 捕获的路由信息的关键词。               |
| comKey          | String  | "component"                                  | 导出路由文件的 key。                   |
| routerVar       | String  | "routes"                                     | 生成文件默认导出的变量名               |
| exts            | Array   | [".js", ".jsx", ".tsx"]                      | 需要匹配的文件后缀名                   |
| isLazy          | Boolean | true                                         | 导出的组件是否为懒加载                 |
| insertBeforeStr | String  | ""                                           | 生成文件的插入字符，插入在列表变量之前 |
| insertAfterStr  | String  | ""                                           | 生成文件的插入字符，插入在列表变量之后 |

### fileDir

根据此文件下的后缀名文件进行匹配，在此文件夹下`创建，修改，添加`可以成功匹配的后缀名文件且包含文件路由信息都会动态修改路由信息。

1. 文件匹配完生成的路由列表

```js
// ./src/router.jsx
const routes = [
  { title: "test", path: "/test", component:()=> import(".\\pages\\test.js") },
  // .....
];
export default routes;

// -----------------

// ./src/pages/test.js
export default function Test() {
  return <div>test</div>;
}
Test.route = {
  title: "test",
  path: "/test",
};
```

2. 修改`./src/pages/test.js`

```js
// ./src/pages/test.js
export default function Test() {
  return <div>test</div>;
}
Test.route = {
  title: "哈哈哈哈",
  path: "/test",
};
```

路由文件会自动更新。

```js
// ./src/router.jsx
const routes = [
  {
    title: "哈哈哈哈",
    path: "/test",
    component: () => import(".\\pages\\test.js"),
  },
];
export default routes;
```

### outputFile

生成的路由信息文件路径。默认路径：`your project/src/router.jsx`

### keyWord

告知查找的关键词信息，将会从文件中匹配 暴露出去的关键词获取路由信息,而且路由信息必须为`Object`类型。如下：

#### 使用 export default 暴露的对象/函数属性名与关键词匹配

```js
// ./src/pages/test.js
export default Class Test{
  //...
}

// success type:Object
Test.route = {
  tile:"test",
  path:"/test"
}

// fail type:Array
Test.route =[{
  tile:"test",
  path:"/test"
}]

// ./src/pages/person.js
export default function Person(props){
 // any code
}
// success type:Object
Person.route={
  tile:"person",
  path:"/person"
}

```

#### 使用 export const 暴露的变量名与关键词匹配

```js
// ./src/pages/test.js

// success type:Object
export const route = { tile: "test", path: "/test" };

// fail type: Array
export const route = [
  { tile: "test", path: "/test", component: () => import("./pages/test.js") },
];
```

### comKey

指定生成的导入路由信息的组件 key 值默认：`component`

```js
// ./src/router.jsx
const routes = [
  {
    title: "test",
    path: "/test",
    component: () => import(".\\pages\\test.js"),
  },
];
export default routes;
```

当`comKey`为其他值：`page`:

```js
// ./src/router.jsx
const routes = [
  { title: "test", path: "/test", page: () => import(".\\pages\\test.js") },
  // ....
];
export default routes;
```

### routerVar

指定生成的导入路由信息的 变量名 值默认：`routes`

- 当`routerVar`为：`pages`:

```js
// ./src/router.jsx
const pages = [
  { title: "test", path: "/test", page: () => import(".\\pages\\test.js") },
  // ....
];
export default pages;
```

### exts

需要从`fileDir`文件夹下哪些文件后缀提取路由信息。默认:`[".js", ".jsx", ".tsx"]`

以下文件都会被提取。

```shell
./src/pages/index.js
./src/pages/test.jsx
./src/pages/demo.tsx
./src/pages/test/demo.tsx
./src/pages/test/any/test.tsx
```

### isLazy

导出的组件形式是否使用懒加载。默认值：`true`

```js
// ./src/router.jsx
const routes = [
  {
    title: "test",
    path: "/test",
    component: () => import("./pages./test.js"),
  },
];
export default routes;
```

- 当 `isLazy` 为 `false`时，会自动帮你导入组件，并且生成 自闭合的 React 组件，标签名称则为：路径名称去掉`./\`且首字母大写。

```js
// ./src/router.jsx
// 本文件为脚本自动生成，请勿修改
import Pagestestjs from "./pages./test.js";

const routes = [
  {
    title: "test",
    path: "/test",
    component: <Pagestestjs />,
  },
];
export default routes;
```

### insertBeforeStr

需要插入生产文件变量之前的字符串。例如 insertBeforeStr 为`import React from "react"`,它将会变量之前显示。

```js
// 本文件为脚本自动生成，请勿修改
import React from "react";

const routes = [
  {
    //......
  },
];

export default routes;
```

### insertAfterStr

需要插入生产文件变量之后的字符串。例如 insertAfterStr 为`routes.push({title:"after",key:"after",component:()=>import("./pages/after.js")})`,它将会变量之后显示。

```js
// 本文件为脚本自动生成，请勿修改

const routes = [
  {
    //......
  },
];

routes.push({
  title: "after",
  key: "after",
  component: () => import("./pages/after.js"),
});
export default routes;
```

## 暴露出的路由信息

支持信息自定义，排序。会原封不动的把数据拼接到生成的列表。 `order` 属性用来排序，越小越靠前。

```js
// ./pages/index.js
export const route = {
  order: 1, // number  支持排序，越小越靠前，越大越靠后。 若无此项默认为 0 靠前
  path: "/",
};

// ./pages/test.js
export const route = {
  order: 2, // number  支持排序，越小越靠前，越大越靠后。 若无此项默认为 0 靠前
  path: "/test",
};
```

生成的文件信息 如下

```js
// ./src/router.jsx
const routes = [
  {
    path: "/",
    order: 1,
    component: () => import("./pages/index.js"),
  },
  {
    path: "/test",
    order: 2,
    component: () => import("./pages/test.js"),
  },
];
```
