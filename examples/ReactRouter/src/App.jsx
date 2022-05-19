import { BrowserRouter, Link } from "react-router-dom";
import MyRouter from "./router";
import "./index.less";
function Title() {
  return (
    <>
      <h1>
        welcome to use the
        <a href="https://github.com/kongyijilafumi/vite-plugin-react-router-generator">
          vite-plugin-react-router-generator
        </a>
        <div>use not lazy router</div>
      </h1>
      <div className="links">
        <Link to="/">Home</Link>
        <Link to="/user">User</Link>
        <Link to="/user/details">User details</Link>
        <Link to="/user/details/info">User details info</Link>
        <Link to="/user/520">User id：520</Link>
        <Link to="/asda">any Pages</Link>
      </div>
    </>
  );
}
function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Title />
        <hr />
        <MyRouter />
      </div>
    </BrowserRouter>
  );
}

export default App;
