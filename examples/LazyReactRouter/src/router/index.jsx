import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import routes from "./list";

function Spinner() {
  return <div>loadding....</div>;
}
export default function MyRouter() {
  return (
    <Routes>
      {routes.map((item) => {
        const Element = lazy(item.element);
        const Page = (
          <Suspense fallback={<Spinner />}>
            <Element />
          </Suspense>
        );
        return <Route path={item.path} key={item.path} element={Page} />;
      })}
    </Routes>
  );
}
