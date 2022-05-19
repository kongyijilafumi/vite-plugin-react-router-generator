import { useParams } from "react-router-dom";

export default function Person() {
  const { id } = useParams();
  return (
    <div>
      <h3>this is personal Page</h3>
      <div>userId -- {id}</div>
    </div>
  );
}

Person.route = {
  path: "/user/:id",
  order: 201,
};
