export default function Home() {
  return (
    <div>
      <h2>this is Home Page</h2>
    </div>
  );
}
// order 排序 越小越靠前
Home.route = {
  path: "/",
  key: "index",
  order: 100,
};
