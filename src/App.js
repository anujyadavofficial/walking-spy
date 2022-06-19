import "./styles.css";
import React, { useState } from "react";
import { Walker } from "./walker";

export default function App() {
  const store = { state: {}, specs: Walker.Specs };
  return (
    <div className="App">
      <Home store={store} />
    </div>
  );
}

export function Home(props) {
  return (
    <div className="Home">
      <Header />
      <Canvas store={props.store} />
    </div>
  );
}

export function Canvas(props) {
  const { store } = props;
  const [index, setIndex] = useState(0);

  const menuClicked = (index) => {
    setIndex(index);
  };
  return (
    <div className="Canvas">
      <Menu specs={store.specs} onClick={menuClicked} />
      <Playground spec={store.specs[index]} />
    </div>
  );
}

export function Header(props) {
  return <div className="Header">Walking Spy</div>;
}

export function Menu(props) {
  const classes = `text-start menu-container m-5 p-5`;
  return (
    <div className="Menu">
      <h3>Specs</h3>
      <br />
      <ul className={classes}>
        {props.specs.map((spec, index) => {
          return (
            <MenuItem
              key={index}
              spec={spec}
              onClick={() => {
                props.onClick(index);
              }}
            />
          );
        })}
      </ul>
    </div>
  );
}

export function MenuItem(props) {
  const { spec, onClick } = props;
  return (
    <li className="MenuItem" onClick={onClick}>
      {spec.title}
    </li>
  );
}

export function Playground(props) {
  const { spec } = props;
  return (
    <div className="Playground">
      <h6>{spec.title}</h6>
      <div>{spec.description}</div>
      <Runner spec={spec} />
    </div>
  );
}

export function Runner(props) {
  const { spec } = props;
  switch (spec.index) {
    case 0:
      return <OnlyTwoInputs {...props} />;
    case 1:
      return <ManyInputs {...props} />;
    default:
      return <div>Nothing</div>;
  }
}

export function OnlyTwoInputs(props) {
  return (
    <div className="OnlyTwoInputs">
      <input />
      <input type="text" />
    </div>
  );
}
export function ManyInputs(props) {
  return (
    <div className="ManyInputs">
      <input type="text" />
      <input type="text" />
      <input type="text" />
    </div>
  );
}
