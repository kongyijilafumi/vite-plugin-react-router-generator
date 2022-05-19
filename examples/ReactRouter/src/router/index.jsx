import { useRoutes } from "react-router-dom";
import React from "react";
import routes from "./list";

/**
 *
 * @typedef { Array<{path:string; element:React.ReactNode; order:number; key:string; parentKey?:string }> } routerList the plugin generate router info
 * @typedef { { path:string; element:React.ReactNode; children?:Array<formatRouterInfo> } } formatRouterInfo the format generate router info
 * @param {routerList} routes generate router info list
 * @returns {Array<formatRouterInfo>} formatRouterList
 */
function formatRouterList(routes) {
  const map = new Map();
  routes.forEach((item) => {
    const { key, parentKey, element, path } = item;
    const routerInfo = { element, path };
    map.set(key, routerInfo);
    const current = map.get(key);
    if (parentKey) {
      const parent = map.get(parentKey);
      if (parent.children) {
        parent.children.push(current);
      } else {
        parent.children = [current];
      }
    } else {
      current.isParent = true;
    }
  });
  return [...map.values()].filter((i) => i.isParent);
}

const formatRoutes = formatRouterList(routes);
console.log(formatRoutes);
export default function MyRouter() {
  return useRoutes(formatRoutes);
}
