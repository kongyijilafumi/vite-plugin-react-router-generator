export default function Info() {
  return (
    <div>
      <h4>this is details info page</h4>
      <hr />
    </div>
  );
}
Info.route = {
  path: "info",
  order: 202,
  key: "detailsinfo",
  parentKey: "details",
};
