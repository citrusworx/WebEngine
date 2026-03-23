import fs from "node:fs";
import gulp from "gulp";
import rename from "gulp-rename";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import { resolve } from "node:path";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

const sass = gulpSass(dartSass);


const styles = () => {
    return gulp.src(resolve(__dirname, "src/juice.scss"))
        .pipe(sass().on("error", (err: any) => console.error("SASS ERROR:", err.message)))
        .pipe(rename("index.css"))
        .pipe(gulp.dest(resolve(__dirname, "dist")))
        .on("end", () => {
            console.log("Dest path:", resolve(__dirname, "dist"));
            console.log("Files in dist:", fs.readdirSync(resolve(__dirname, "dist")));
        });
};

const watch = () => {
    gulp.watch("./src/**/*.scss", styles)
}

export const build = gulp.series(styles);
export const dev = gulp.series(styles, watch);
export default build;
