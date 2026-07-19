import "@citrusworx/juiceui/styles";
import { mount } from "@citrusworx/sigjs";
import { App } from "./App";
import { installNavigation } from "./app/router";
import "./generated/blackwatersound-theme.css";
import "./styles/index.css";
import "./styles/hub.css";
import "./styles/ks-pages.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Blackwater Sound root element was not found.");
}

installNavigation();
mount(<App />, root);
