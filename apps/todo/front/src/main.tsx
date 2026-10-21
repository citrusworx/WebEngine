import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/tide";
import { mount } from "@citrusworx/sigjs";
import { App } from "./App";
import "./todo.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("ToDo root element was not found.");
}

mount(<App />, root);
