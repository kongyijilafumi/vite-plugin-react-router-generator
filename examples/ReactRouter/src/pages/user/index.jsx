import { Outlet } from "react-router-dom";

export default function User() {
  return (
    <div>
      <h2>this is User Page</h2>
      <div>
        this is personal user Page.<b>⬇</b>
      </div>
      <hr />
      <Outlet />
    </div>
  );
}

export const route = {
  path: "user",
  order: 200,
  key: "user",
};
