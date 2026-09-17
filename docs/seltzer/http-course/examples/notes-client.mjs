import { client, HttpError } from "@citrusworx/seltzer";

const baseUrl = "http://127.0.0.1:3000";
const endpoint = (path) => ({ path, endpoint: path, options: { baseUrl } });

try {
  const note = await client.post(endpoint("/notes"), { text: "Learn HTTP" });
  console.log("Created:", note);
  console.log("Read:", await client.get(endpoint(`/notes/${note.id}`)));
  console.log("Changed:", await client.patch(endpoint(`/notes/${note.id}`), { text: "Understand HTTP" }));
  console.log("Deleted:", await client.delete(endpoint(`/notes/${note.id}`)));
  await client.get(endpoint(`/notes/${note.id}`));
} catch (error) {
  if (error instanceof HttpError) {
    console.log("HTTP response:", error.status, error.body);
  } else {
    console.error("Request failed before a usable result:", error);
    process.exitCode = 1;
  }
}
