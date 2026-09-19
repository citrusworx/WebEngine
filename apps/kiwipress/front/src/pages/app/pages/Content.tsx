import { router } from "../../../router";
import { DashboardLayout } from "../layout/DashboardLayout";
import { TransferPanel } from "./TransferPanel";

export function Content() {
    return (
        <DashboardLayout page="content">
            <div dashboard-page>
                <header page-header>
                    <h1>Content</h1>
                    <p lede>
                        Transfer WordPress collections into the native Nectarine CMS. Edit day-to-day writing from Posts and Pages.
                    </p>
                </header>

                <div section-block>
                    <h2 section-kicker>Collections</h2>
                    <div tile-grid="features">
                        <div panel-card>
                            <div tile-head>
                                <div choice-icon>
                                    <i icon="pen" lib="solid" iconSize="sm"></i>
                                </div>
                            </div>
                            <strong>Posts</strong>
                            <p subtle>Create, list, edit, and delete posts against the running gateway.</p>
                            <button
                                btn="outline"
                                type="button"
                                scale="sm"
                                onclick={() => router.navigate("/app/posts")}
                            >
                                Open Posts
                                <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                            </button>
                        </div>
                        <div panel-card>
                            <div tile-head>
                                <div choice-icon>
                                    <i icon="file" lib="solid" iconSize="sm"></i>
                                </div>
                            </div>
                            <strong>Pages</strong>
                            <p subtle>Same editor shell as posts, wired to the pages collection.</p>
                            <button
                                btn="outline"
                                type="button"
                                scale="sm"
                                onclick={() => router.navigate("/app/pages")}
                            >
                                Open Pages
                                <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div section-block>
                    <h2 section-kicker>Transfer</h2>
                    <TransferPanel />
                </div>
            </div>
        </DashboardLayout>
    );
}
