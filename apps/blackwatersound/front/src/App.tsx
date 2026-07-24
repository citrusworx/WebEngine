import { SiteNav } from "./components/brand/SiteNav";
import { Render } from "./app/Render";
import { currentPath } from "./app/router";
import { ComingSoon } from "./routes/ComingSoon";
import { ProductsPage } from "./routes/ProductsPage";
import { BlogPost } from "./routes/BlogPost";
import { CourseLesson } from "./routes/CourseLesson";
import { ProductPage } from "./routes/ProductPage";
import { SigRouterShowcase } from "./routes/SigRouterShowcase";
import { ArtistHub } from "./routes/ArtistHub";
import { StudioPortal } from "./routes/portals/StudioPortal";
import { LabelPortal } from "./routes/portals/LabelPortal";
import { LearnerPortal } from "./routes/portals/LearnerPortal";

function renderRoute(path: string) {
  switch (path) {
    case "/sig-router":
      return <SigRouterShowcase />;
    case "/products":
      return <ProductsPage />;
    case "/blog":
      return <BlogPost />;
    case "/lesson":
      return <CourseLesson />;
    case "/product":
      return <ProductPage />;
    case "/artist":
      return <ArtistHub />;
    case "/portal/studio":
      return <StudioPortal />;
    case "/portal/label":
      return <LabelPortal />;
    case "/portal/learner":
      return <LearnerPortal />;
    case "/":
    default:
      return <ComingSoon />;
  }
}

function usesHubChrome(path: string) {
  return path === "/artist" || path.startsWith("/portal/");
}

export function App() {
  return (
    <div app-shell theme="blackwatersound" stack>
      <Render>{() => (usesHubChrome(currentPath.get()) ? null : <SiteNav />)}</Render>
      <main id="page-view" stack>
        <Render>{() => renderRoute(currentPath.get())}</Render>
      </main>
    </div>
  );
}
