import fs from "node:fs";
import { fileURLToPath } from "node:url";
import gulp from "gulp";
import rename from "gulp-rename";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import { dirname, resolve } from "node:path";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";

const sass = gulpSass(dartSass);
const ROOT_DIR = dirname(fileURLToPath(import.meta.url));
const TEXTURE_SRC_ROOT = resolve(ROOT_DIR, "src/styles/textures");
const DIST_ROOT = resolve(ROOT_DIR, "dist");

const THEME_ENTRIES = [
    { id: "aquaflux", src: "src/themes/aquaflux/aquaflux.scss" },
    { id: "kiwipress", src: "src/themes/kiwipress/kiwipress.scss" },
    { id: "citrusmint", src: "src/themes/citrusmint/citrusmint.scss" },
] as const;

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

const buildThemeStyles =
    (themeId: string, srcRelative: string) =>
    () => {
        return gulp
            .src(resolve(ROOT_DIR, srcRelative))
            .pipe(sassPipeline())
            .pipe(postcssPipeline())
            .pipe(rename(`${themeId}.css`))
            .pipe(gulp.dest(resolve(DIST_ROOT, "themes")));
    };

const stylesThemes = gulp.parallel(...THEME_ENTRIES.map(({ id, src }) => buildThemeStyles(id, src)));

const icons = () => {
    return gulp.src("./src/icons/**/*.svg").pipe(gulp.dest("./dist/icons"));
};

const watchAll = () => {
    gulp.watch("./src/**/*.scss", gulp.parallel(stylesCore, stylesThemes));
    gulp.watch("./src/icons/**/*.svg", icons);
};

export { clean };
export const build = gulp.series(clean, stylesCore, stylesThemes, icons);
export const dev = gulp.series(stylesCore, stylesThemes, icons, watchAll);
export default build;
