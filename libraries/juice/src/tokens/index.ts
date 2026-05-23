import black from "./color/black/black.json";
import blue from "./color/blue/blue.json";
import brown from "./color/brown/brown.json";
import gray from "./color/gray/gray.json";
import green from "./color/green/green.json";
import orange from "./color/orange/orange.json";
import pink from "./color/pink/pink.json";
import purple from "./color/purple/purple.json";
import red from "./color/red/red.json";
import white from "./color/white/white.json";
import yellow from "./color/yellow/yellow.json";

export const tokens = {
    colors: {
        families: [
            "black",
            "blue",
            "brown",
            "gray",
            "green",
            "orange",
            "pink",
            "purple",
            "red",
            "white",
            "yellow"
        ],
        black: black.black,
        blue: blue.blue,
        brown: brown.brown,
        gray: gray.gray,
        green: green.green,
        orange: orange.orange,
        pink: pink.pink,
        purple: purple.purple,
        red: red.red,
        white: white.white,
        yellow: yellow.yellow
    },
    sizing: {},
    spacing: {},
    typography: {
        providers: ["adobe", "google"]
    },
    themes: {}
};
