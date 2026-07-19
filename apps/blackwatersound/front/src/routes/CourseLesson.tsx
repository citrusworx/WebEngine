import { Signal } from "@citrusworx/sigjs";
import { Render } from "../app/Render";
import { PageFooter } from "../components/brand/PageFooter";
import { GUITAR_IMG } from "../components/brand/brand";
import { BIAS_LESSON } from "../data/bias-lesson";

const playing = Signal(false);
const activeSection = Signal(0);

export function CourseLesson() {
  return (
    <div ks-page>
      <div ks-shell ks-lesson-wrap>
        <div ks-lesson-grid>
          <main ks-lesson-main>
            <div ks-lesson-breadcrumb>
              <span ks-lesson-course>{BIAS_LESSON.course}</span>
              <span ks-lesson-sep>›</span>
              <span ks-lesson-index>
                Lesson {BIAS_LESSON.lessonNumber} of {BIAS_LESSON.totalLessons}
              </span>
            </div>

            <h1 ks-lesson-title>
              {BIAS_LESSON.titleLine1}
              <br />
              {BIAS_LESSON.titleLine2}
            </h1>

            <div ks-lesson-progress>
              <div ks-lesson-progress-head>
                <span ks-lesson-progress-label>Course progress</span>
                <span ks-lesson-progress-value>{BIAS_LESSON.progressPercent}%</span>
              </div>
              <div ks-lesson-progress-track>
                <div ks-lesson-progress-bar style={{ width: `${BIAS_LESSON.progressPercent}%` }} />
              </div>
            </div>

            <div ks-lesson-video>
              <Render>
                {() =>
                  playing.get() ? (
                    <div ks-lesson-video-active>
                      <p>Video player active</p>
                    </div>
                  ) : (
                    <div ks-lesson-video-idle>
                      <img src={GUITAR_IMG} alt="Lesson thumbnail" ks-lesson-video-thumb />
                      <div ks-lesson-video-controls>
                        <span ks-lesson-video-kicker>
                          Lesson {BIAS_LESSON.lessonNumber} · {BIAS_LESSON.duration}
                        </span>
                        <button
                          type="button"
                          ks-lesson-play-btn
                          aria-label="Play lesson"
                          onClick={() => playing.set(true)}
                        >
                          <span ks-lesson-play-icon aria-hidden="true" />
                        </button>
                        <p ks-lesson-video-title>
                          {BIAS_LESSON.titleLine1} {BIAS_LESSON.titleLine2}
                        </p>
                      </div>
                    </div>
                  )
                }
              </Render>
            </div>

            <div ks-lesson-tabs>
              <Render>
                {() => {
                  const sectionIndex = activeSection.get();
                  return BIAS_LESSON.sections.map((section, index) => (
                    <button
                      key={section.title}
                      type="button"
                      ks-lesson-tab
                      data-active={sectionIndex === index ? true : undefined}
                      onClick={() => activeSection.set(index)}
                    >
                      {section.title}
                    </button>
                  ));
                }}
              </Render>
            </div>

            <Render>
              {() => (
                <p ks-lesson-section-copy>
                  {BIAS_LESSON.sections[activeSection.get()].content}
                </p>
              )}
            </Render>

            <div ks-lesson-takeaways>
              <p ks-lesson-takeaways-title>Key Takeaways</p>
              {BIAS_LESSON.takeaways.map((point, index) => (
                <div key={point} ks-lesson-takeaway-row>
                  <span ks-lesson-takeaway-num data-tone={index % 2 === 0 ? "lime" : "orange"}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p ks-lesson-takeaway-copy>{point}</p>
                </div>
              ))}
            </div>

            <div ks-lesson-nav-row>
              <button type="button" ks-lesson-nav-btn data-tone="muted">
                ← Previous Lesson
              </button>
              <button type="button" ks-lesson-nav-btn data-tone="cyan">
                Next Lesson →
              </button>
            </div>
          </main>

          <aside ks-lesson-sidebar>
            <p ks-lesson-sidebar-title>{BIAS_LESSON.course}</p>
            <p ks-lesson-sidebar-meta>{BIAS_LESSON.courseMeta}</p>
            <div ks-lesson-outline>
              {BIAS_LESSON.outline.map((item) => (
                <div
                  key={item.num}
                  ks-lesson-outline-item
                  data-active={"active" in item ? true : undefined}
                  data-done={"done" in item ? true : undefined}
                >
                  <span ks-lesson-outline-index>
                    {"done" in item ? "✓" : item.num}
                  </span>
                  <span ks-lesson-outline-label>{item.title}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <PageFooter />
    </div>
  );
}
