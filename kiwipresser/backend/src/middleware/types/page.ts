interface PageAdapter {
    title: string;
    content: string;
    tags: string[];
    metadata: PageMetadata;
}

interface PageMetadata {
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    author?: string;
    source?: string; // wordpress | drupal | etc
    [key: string]: string | undefined;
}

let demoPage: PageAdapter = {
    title: "Demo",
    content: "Content",
    tags: ["Tag"],
    metadata: {
        date: "today"
    }
}