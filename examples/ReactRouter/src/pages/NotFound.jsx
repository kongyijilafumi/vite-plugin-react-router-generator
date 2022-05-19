export default function ErrorPage() {
  return (
    <div>
      <h1>Not Found</h1>
    </div>
  );
}

ErrorPage.route = {
  path: "*",
  order: 9999,
};
