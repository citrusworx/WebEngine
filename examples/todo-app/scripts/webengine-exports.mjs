import * as webengine from "@citrusworx/webengine";

const names = Object.keys(webengine).sort();
console.log(names.join("\n"));

if (names.includes("createNectarineRoutes")) {
  console.error("createNectarineRoutes is exported; this course expected it to be absent");
  process.exit(1);
}

if (!names.includes("WebEngine")) {
  console.error("WebEngine class export is missing");
  process.exit(1);
}
