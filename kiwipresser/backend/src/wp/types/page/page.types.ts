export interface WPPage {
    id: number;
    slug: string;
    title: {
        rendered: string;
    }
    content: {
        rendered: string;
    }
    excerpt: {
        rendered: string;
    }
    status: string;
    date: string;
    modified: string;
}