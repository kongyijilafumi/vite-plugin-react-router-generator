## 正常使用 react-router

### 1.安装依赖

```bash
npm i
#or
cnpm i
#or
yarn install
```

### 2.修改 vite.config.js 配置

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import ReactRouterGenerator from "../../src/index.js";
import { resolve } from "path";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ReactRouterGenerator({
      outputFile: resolve(".", "./src/router/list.jsx"),
      comKey: "element",
      isLazy: false, // 取消懒加载
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: {
    open: true,
    port: 3001,
  },
});
```

### 3.启动

```
npm run dev
```

## tips

导出的路由信息会是这样的

```js
// ./src/router/list.jsx
// 本文件为脚本自动生成，请勿修改
import PagesNotFoundjsx from "../pages/NotFound.jsx";
import Pageshomeindexjsx from "../pages/home/index.jsx";

const routes = [
  {
    path: "/",
    key: "index",
    order: 100,
    element: <Pageshomeindexjsx />,
  },
  /**
   * .....
   */
  {
    path: "*",
    order: 9999,
    element: <PagesNotFoundjsx />,
  },
];

export default routes;
```

- 你可以直接循环生成路由列表

```js
// ./src/router/index.jsx
import list from "./list.jsx";
import { Routes, Ruote } from "react-router-dom";

export default function MyRouter() {
  return (
    <Routes>
      {list.map((item) => (
        <Ruote key={item.path} {...item} />
      ))}
    </Routes>
  );
}
```

- 或者使用 useRoutes 生成路由信息

```js
// ./src/router/index.jsx
import list from "./list.jsx";
import { useRoutes } from "react-router-dom";

export default function MyRouter() {
  return useRoutes(list);
}
```

### 使用层级关系路由

在暴露路由信息的时候给他们定义好层级关系，在使用路由之前，对路由列表进行处理。

```js
import list from "./list.jsx";
import { useRoutes } from "react-router-dom";

/**
 * list
 * [
 *   { path:"/", element:<Index/> , key:"index" } ,
 *   { path:"user", element:<User /> , key:"user"},
 *   { path:":id", element: <UserId /> , key:"userId", parentKey:"user" }
 * ]
 */

const formatList = formatRouter(list);
/**
 * formatList
 * [
 *  { path:"/", element:<Index/> ,   },
 *  { path:"user", element:<User /> ,  children:[ { ath:":id", element: <UserId /> } ] },
 * ]
 */
function formatRouter(list) {
  // any code...
}
export default function MyRouter() {
  return useRoutes(formatList);
}
```
