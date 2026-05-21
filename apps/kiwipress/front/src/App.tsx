import { Nav } from "./components/nav/Nav";
import { Footer } from "./components/footer/Footer";

export function App() {
    return (
        <div theme="kiwipress">
            <Nav id="nav-main" />
            <div id="page-content"></div>
            <Footer />
        </div>
    )
}
