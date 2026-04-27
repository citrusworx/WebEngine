import { Users } from "./users/users";

async function runExample() {
    const users = new Users();

    console.log("KiwiPress Step 1 smoke test starting...");

    const allUsers = await users.getAll();
    console.log("All users:", allUsers);

    const userByEmail = await users.getByEmail("hello@example.com");
    console.log("User by email:", userByEmail);

    console.log("KiwiPress Step 1 smoke test complete.");
}

runExample().catch((error) => {
    console.error("KiwiPress example failed:", error);
});
