import { Outlet } from "react-router-dom";

export default function Details() {
  return (
    <div>
      <h3>user details</h3>
      <hr />
      <Outlet />

    </div>
  );
}

Details.route = {
  path: "details",
  order: 201,
  key: "details",
  parentKey: "user",
};
