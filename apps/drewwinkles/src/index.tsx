import { mount } from "@citrusworx/sigjs";
import "../../../libraries/juice/src/juice.scss";

type Project = {
  title: string;
  summary: string;
  tags: string[];
};

type TimelineItem = {
  title: string;
  period: string;
  description: string;
};

const profile = {
  name: "Drew Winkles",
  role: "Builder of sharp digital experiences, brands, and systems.",
  intro:
    "A portfolio site designed to feel like a living resume: part creative calling card, part execution snapshot, part clear invitation to work together.",
  location: "Open for remote and hybrid work",
  email: "hello@drewwinkles.com",
  focus: [
    "Frontend systems and polished UI work",
    "Creative direction with technical follow-through",
    "Fast-moving brand, content, and product launches"
  ],
  metrics: [
    { label: "Years building", value: "8+" },
    { label: "Launches shipped", value: "30+" },
    { label: "Disciplines blended", value: "Design / Code / Strategy" }
  ] satisfies Array<{ label: string; value: string }>,
  projects: [
    {
      title: "Narrative Portfolio Systems",
      summary:
        "Designed portfolio experiences that read like editorial products instead of static resumes, balancing visual character with clear hiring signals.",
      tags: ["Art direction", "Front-end", "UX writing"]
    },
    {
      title: "Brand-to-Web Pipelines",
      summary:
        "Turned identity work into launch-ready landing pages, design systems, and reusable site sections that move cleanly from concept to production.",
      tags: ["Design systems", "Component thinking", "Launch work"]
    },
    {
      title: "Content-Driven Product Pages",
      summary:
        "Built pages that help people understand what matters fast, using hierarchy, motion, and structure instead of noisy filler.",
      tags: ["Content design", "Marketing sites", "Performance"]
    }
  ] satisfies Project[],
  timeline: [
    {
      title: "Independent creative and technical work",
      period: "Recent",
      description:
        "Focused on sites, brand systems, and digital presentation work that need both taste and follow-through."
    },
    {
      title: "Product-minded front-end delivery",
      period: "Ongoing",
      description:
        "Bridged strategy, design, and implementation to get polished interfaces out the door without losing the concept."
    },
    {
      title: "Systems over one-off output",
      period: "Core approach",
      description:
        "Built reusable patterns that keep content, design, and engineering aligned after the first launch."
    }
  ] satisfies TimelineItem[],
  skills: [
    "UI architecture",
    "Visual storytelling",
    "Design systems",
    "Responsive implementation",
    "Creative strategy",
    "Content hierarchy",
    "Rapid prototyping",
    "Launch-focused execution"
  ]
};

function StatCard(props: { label: string; value: string }) {
  return (
    <article stack gap="0.5" bgColor="white-100" padding="1rem" shadow="green-400" depth="sm" rounded>
      <span font="korolev-rounded-bold" fontSize="xl">{props.value}</span>
      <span font="korolev-rounded" fontColor="gray-700">{props.label}</span>
    </article>
  );
}

function ProjectCard(props: Project) {
  return (
    <article stack gap="1" bgColor="white-100" padding="1rem" shadow="green-400" depth="sm" rounded>
      <div row>
        <h3 font="korolev-rounded-bold" fontSize="lg">{props.title}</h3>
      </div>
      <p font="korolev-rounded" fontColor="gray-700">{props.summary}</p>
      <div row gap="1">
        {props.tags.map((tag) => (
          <span bgColor="green-200" paddingX="1rem" paddingY="1rem" rounded font="korolev-rounded">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function TimelineCard(props: TimelineItem) {
  return (
    <article stack gap="0.75" bgColor="white-100" padding="1rem" shadow="green-400" depth="sm" rounded>
      <div font="korolev-rounded-bold" fontColor="green-700">{props.period}</div>
      <h3 font="korolev-rounded-bold" fontSize="lg">{props.title}</h3>
      <p font="korolev-rounded" fontColor="gray-700">{props.description}</p>
    </article>
  );
}

function App() {
  return (
    <main gradient="citrusmint-300" font="korolev-rounded">
      <div row space="around" paddingY="1rem">
        <i icon="github" height="4rem" width="4rem" iconcolor="wintergreen-600" hover="wintergreen-900"></i>
        <i icon="toggle-on" lib="solid" height="4rem" width="4rem" iconcolor="wintergreen-600" hover="wintergreen-900"></i>
      </div>
      <div texture="grid.pat-003">
      <div container stack gap="2" paddingY="2rem">
        <section row gap="2" bgColor="white-100" padding="2rem" shadow="green-500" depth="xl" rounded>
          <div row>
            <div stack gap="2">
              <div stack gap="1">
                <p font="korolev-rounded-bold" fontColor="green-700">Personal resume / portfolio</p>
                <h1 font="korolev-rounded-bold" fontSize="xxl">{profile.name}</h1>
                <p font="korolev-rounded-bold" fontSize="xl" width="75%">{profile.role}</p>
                <p font="korolev-rounded" fontSize="md" width="80%">{profile.intro}</p>
              </div>

              <div row gap="1" centered>
                <a btn="flat" theme="citrusmint-300" padding="1rem" font="korolev-rounded-bold" href={`mailto:${profile.email}`}>
                  Start a conversation
                </a>
                <a btn="outline" theme="citrusmint-300" padding="1rem" font="korolev-rounded-bold" href="#selected-work">
                  View selected work
                </a>
              </div>
            </div>
          </div>

          <div bgColor="green-100" padding="1rem" rounded stack gap="1">
            <span font="korolev-rounded-bold" fontColor="green-700">Current focus</span>
            <p font="korolev-rounded-bold" fontSize="lg">{profile.location}</p>
            <ul stack gap="0.5">
              {profile.focus.map((item) => (
                <li font="korolev-rounded">{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section stack gap="1">
          <div content stack gap="1">
            <p font="korolev-rounded-bold" fontColor="green-700">Highlights</p>
            <div row gap="1">
              {profile.metrics.map((metric) => (
                <StatCard label={metric.label} value={metric.value} />
              ))}
            </div>
          </div>
        </section>

        <section id="selected-work" stack gap="1.5" bgColor="white-100" padding="2rem" shadow="green-500" depth="xl" rounded>
          <div stack gap="0.5">
            <p font="korolev-rounded-bold" fontColor="green-700">Selected work</p>
            <h2 font="korolev-rounded-bold" fontSize="xl">Designing presence, not just pages.</h2>
          </div>
          <div stack gap="1">
            {profile.projects.map((project) => (
              <ProjectCard {...project} />
            ))}
          </div>
        </section>

        <section stack gap="1.5" bgColor="white-100" padding="2rem" shadow="green-500" depth="xl" rounded>
          <div stack gap="0.5">
            <p font="korolev-rounded-bold" fontColor="green-700">Approach</p>
            <h2 font="korolev-rounded-bold" fontSize="xl">Built around momentum and clarity.</h2>
          </div>
          <div stack gap="1">
            {profile.timeline.map((item) => (
              <TimelineCard {...item} />
            ))}
          </div>
        </section>

        <section stack gap="2" bgColor="white-100" padding="2rem" shadow="green-500" depth="xl" rounded>
          <div stack gap="1">
            <p font="korolev-rounded-bold" fontColor="green-700">Capabilities</p>
            <h2 font="korolev-rounded-bold" fontSize="xl">Useful across strategy, design, and execution.</h2>
          </div>
          <div row wrap gap="1" container>
            {profile.skills.map((skill) => (
              <span bgColor="green-200" padding="0.9rem" rounded font="korolev-rounded" hover="green-400">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section stack gap="1" bgColor="white-100" padding="2rem" shadow="green-500" depth="xl" rounded>
          <p font="korolev-rounded-bold" fontColor="green-700">Contact</p>
          <h2 font="korolev-rounded-bold" fontSize="xl">Looking for thoughtful, high-character work.</h2>
          <p font="korolev-rounded" fontColor="gray-700" width="80%">
            If the project needs taste, pace, and real execution, this site is meant to make the next step obvious.
          </p>
          <div row gap="1">
            <a center btn="flat" theme="citrusmint-300" padding="1rem" font="korolev-rounded-bold" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}

mount(<App />, document.getElementById("root")!);
