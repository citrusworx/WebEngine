import fs from "node:fs";
import { fileURLToPath } from "node:url";
import gulp from "gulp";
import rename from "gulp-rename";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import { dirname, resolve } from "node:path";
import postcss from "gulp-postcss";

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
                        .replace(/[<>#%{}|\\^~\[\]`]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
                    return `url("data:image/svg+xml,${encoded}")`;
                }
            );
        },
    };
};

(inlineSvgTextures as unknown as { postcss?: boolean }).postcss = true;


const clean = async () => {
    await fs.promises.rm(DIST_ROOT, { recursive: true, force: true });
    await fs.promises.mkdir(DIST_ROOT, { recursive: true });
};

const styles = () => {
    return gulp.src(resolve(ROOT_DIR, "src/juice.scss"))
        .pipe(sass().on("error", (err: any) => console.error("SASS ERROR:", err.message)))
        .pipe(postcss([inlineSvgTextures()]))
        .pipe(rename("index.css"))
        .pipe(gulp.dest(DIST_ROOT));
};

const icons = () => {
    return gulp.src("./src/icons/**/*.svg")
            .pipe(gulp.dest("./dist/icons"));
}

const watch = () => {
    gulp.watch("./src/**/*.scss", styles);
    gulp.watch("./src/icons/**/*.svg", icons);
}

export { clean };
export const build = gulp.series(clean, styles, icons);
export const dev = gulp.series(styles, icons, watch);
export default build;
