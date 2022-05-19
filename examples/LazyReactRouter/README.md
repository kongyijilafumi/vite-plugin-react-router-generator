## 使用懒加载 react-router

### 1.安装依赖

```bash
npm i
#or
cnpm i
#or
yarn install
```

### 2.启动

```
npm run dev
```

## tips

使用路由懒加载，需要用到`React.lazy`,`React.Suspense`去包裹动态生成的路由信息。[案例网址](https://stackblitz.com/github/remix-run/react-router/tree/main/examples/lazy-loading)

```js
import { lazy, Suspense } from "react";
function Spinner() {
  return <div>loadding....</div>;
}
const Lazy = lazy(() => import("../pages/xxx.jsx"));

const Page = (
  <Suspense fallback={<Spinner />}>
    <Lazy />
  </Suspense>
);
const route = <Route path="xxx" element={Page} />;
```
