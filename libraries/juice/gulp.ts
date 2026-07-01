import fs from "node:fs";
import { fileURLToPath } from "node:url";
import gulp from "gulp";
import rename from "gulp-rename";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import { dirname, resolve } from "node:path";
import postcss from "gulp-postcss";
import postcssRuntime from "postcss";
import autoprefixer from "autoprefixer";
import { collectThemeEntries, generateThemeArtifacts } from "./src/tools/theme-generator/index.ts";

const sass = gulpSass(dartSass);
const ROOT_DIR = dirname(fileURLToPath(import.meta.url));
const TEXTURE_SRC_ROOT = resolve(ROOT_DIR, "src/styles/textures");
const DIST_ROOT = resolve(ROOT_DIR, "dist");

const inlineSvgTextures = () => {
    return {
        postcssPlugin: "inline-svg-textures",
        Declaration(decl: { value?: string }) {
            if (!decl.value?.includes("url(")) return;

            decl.value = decl.value.replace(
                /url\((['"]?)\.\/(grid|hexa)\/svg\/([^'")]+\.svg)\1\)/g,
                (_match, _quote, category, file) => {
                    const filePath = resolve(TEXTURE_SRC_ROOT, category, "svg", file);
                    const svg = fs.readFileSync(filePath, "utf8")
                        .replace(/<\?xml[^?]*\?>/g, "")
                        .replace(/<!--[\s\S]*?-->/g, "")
                        .replace(/\s+/g, " ")
                        .trim();
                    const encoded = svg
                        .replace(/"/g, "'")
                        .replace(/[<>#%{}|\\^~\[\]`]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
                    return `url("data:image/svg+xml,${encoded}")`;
                }
            );
        },
    };
};

(inlineSvgTextures as unknown as { postcss?: boolean }).postcss = true;

const sassPipeline = () =>
    sass().on("error", (err: { message: string }) => {
        console.error("SASS ERROR:", err.message);
    });

const postcssPipeline = () => postcss([inlineSvgTextures(), autoprefixer()]);

const clean = async () => {
    await fs.promises.rm(DIST_ROOT, { recursive: true, force: true });
    await fs.promises.mkdir(DIST_ROOT, { recursive: true });
    await fs.promises.mkdir(resolve(DIST_ROOT, "themes"), { recursive: true });
};

const stylesCore = () => {
    return gulp
        .src(resolve(ROOT_DIR, "src/juice.core.scss"))
        .pipe(sassPipeline())
        .pipe(postcssPipeline())
        .pipe(rename("index.css"))
        .pipe(gulp.dest(DIST_ROOT));
};

const generateThemes = async () => {
    await generateThemeArtifacts();
};

const compileThemeStyles = async (themeId: string, srcRelative: string) => {
    const sourcePath = resolve(ROOT_DIR, srcRelative);
    const outputPath = resolve(DIST_ROOT, "themes", `${themeId}.css`);
    const sassResult = await dartSass.compileAsync(sourcePath, {
        loadPaths: [resolve(ROOT_DIR, "src")],
    });
    const postcssResult = await postcssRuntime([inlineSvgTextures(), autoprefixer()]).process(sassResult.css, {
        from: sourcePath,
        to: outputPath,
    });

    await fs.promises.writeFile(outputPath, postcssResult.css);
};

const stylesThemes = async () => {
    const themeEntries = await collectThemeEntries();
    await Promise.all(themeEntries.map(({ id, src }) => compileThemeStyles(id, src)));
};

const icons = () => {
    return gulp.src("./src/icons/**/*.svg").pipe(gulp.dest("./dist/icons"));
};

const watchAll = () => {
    gulp.watch(
        ["./src/**/*.scss", "./src/themes/**/*.yaml", "./src/themes/**/*.config.yaml"],
        gulp.series(generateThemes, gulp.parallel(stylesCore, stylesThemes))
    );
    gulp.watch("./src/icons/**/*.svg", icons);
};

export { clean };
export const build = gulp.series(clean, generateThemes, stylesCore, stylesThemes, icons);
export const dev = gulp.series(generateThemes, stylesCore, stylesThemes, icons, watchAll);
export default build;
