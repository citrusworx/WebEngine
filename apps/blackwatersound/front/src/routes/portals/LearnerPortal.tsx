import { PortalShell } from "../../layouts/PortalShell";

const courses = [
  { title: "Fuzz Fundamentals", progress: "33%", lessons: "2 / 6" },
  { title: "Amp Biasing 101", progress: "0%", lessons: "0 / 4" }
] as const;

export function LearnerPortal() {
  return (
    <PortalShell
      tone="bw-dark"
      kicker="Learner portal"
      title="Courses, workbook resources, and practice logs"
      body="Extends the public lesson experience with enrolled courses and progress—CourseLesson layout at portal scale."
    >
      <section shell stack gap="1rem">
        {courses.map((course) => (
          <article key={course.title} card stack gap="0.75rem">
            <div row space="between" gap="1rem">
              <p section-title>{course.title}</p>
              <span spec-label>{course.progress}</span>
            </div>
            <p copy="sm">{course.lessons} lessons complete</p>
            <a href="/lesson" button-tone="orange">Continue lesson</a>
          </article>
        ))}

        <article panel surface="bw-panel" stack gap="0.75rem">
          <p kicker>Practice log</p>
          <p copy="sm">Shell for assignments, workbook downloads, and session notes—wired to KiwiPress in Phase 3.</p>
        </article>
      </section>
    </PortalShell>
  );
}
