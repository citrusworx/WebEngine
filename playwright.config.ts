import {defineConfig} from "@playwright/test";

export default defineConfig({
    testDir: ".",
    testMatch: "**/*.test.ts",
    projects: [
        {
            name: "sigjs",
            testDir: "libraries/sig"
        },
        {
            name: "juice",
            testDir: "libraries/juice"
        },
        {
            name: "grapevine",
            testDir: "libraries/grapevine"
        },
        {
            name: "nectarine",
            testDir: "libraries/nectarine"
        },
        {
            name: "citrusworx-front",
            testDir: "apps/citrusworx/front",
            use: { baseURL: "http://localhost:5173" }
        }
    ]
})