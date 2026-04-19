import fs from "node:fs";
import gulp from "gulp";
import rename from "gulp-rename";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import { resolve } from "node:path";
import postcss from "gulp-postcss";

const sass = gulpSass(dartSass);
const JUICE_ASSET_BASE = "/juice";

const rewriteTextureUrls = () => {
    return {
        postcssPlugin: "rewrite-texture-urls",
        Declaration(decl: { value?: string }) {
            if (!decl.value?.includes("url(")) return;

            decl.value = decl.value
                .replace(/url\((['"]?)\.\/grid\//g, `url($1${JUICE_ASSET_BASE}/grid/`)
                .replace(/url\((['"]?)\.\/shadow\//g, `url($1${JUICE_ASSET_BASE}/shadow/`)
                .replace(/url\((['"]?)\.\/grunge\/png\//g, `url($1${JUICE_ASSET_BASE}/grunge/png/`)
                .replace(/url\((['"]?)\.\/png\//g, `url($1${JUICE_ASSET_BASE}/png/`);
        },
    };
};

(rewriteTextureUrls as unknown as { postcss?: boolean }).postcss = true;


const styles = () => {
    return gulp.src(resolve(__dirname, "src/juice.scss"))
        .pipe(sass().on("error", (err: any) => console.error("SASS ERROR:", err.message)))
        .pipe(postcss([rewriteTextureUrls()]))
        .pipe(rename("index.css"))
        .pipe(gulp.dest(resolve(__dirname, "dist")))
        .on("end", () => {
            console.log("Dest path:", resolve(__dirname, "dist"));
            console.log("Files in dist:", fs.readdirSync(resolve(__dirname, "dist")));
        });
};

const icons = () => {
    return gulp.src("./src/icons/**/*.svg")
            .pipe(gulp.dest("./dist/icons"));
}

const grainTextures = () => {
    return gulp.src("./src/styles/textures/grain/png/**/*")
        .pipe(gulp.dest("./dist/png"));
}

const grungeTextures = () => {
    return gulp.src("./src/styles/textures/grunge/png/**/*")
        .pipe(gulp.dest("./dist/png"));
}

const grungeNestedTextures = () => {
    return gulp.src("./src/styles/textures/grunge/png/**/*")
        .pipe(gulp.dest("./dist/grunge/png"));
}

const hexaTextures = () => {
    return gulp.src("./src/styles/textures/hexa/png/**/*")
        .pipe(gulp.dest("./dist/png"));
}

const gridTextures = () => {
    return gulp.src("./src/styles/textures/grid/grid/**/*")
        .pipe(gulp.dest("./dist/grid"));
}

const shadowTextures = () => {
    return gulp.src("./src/styles/textures/shadow/shadow/**/*")
        .pipe(gulp.dest("./dist/shadow"));
}

const textures = gulp.parallel(
    grainTextures,
    grungeTextures,
    grungeNestedTextures,
    hexaTextures,
    gridTextures,
    shadowTextures,
);

const watch = () => {
    gulp.watch("./src/**/*.scss", styles);
    gulp.watch("./src/icons/**/*.svg", icons);
    gulp.watch("./src/styles/textures/**/*", textures);
}

export const build = gulp.series(styles, gulp.parallel(icons, textures));
export const dev = gulp.series(styles, gulp.parallel(icons, textures), watch);
export default build;
