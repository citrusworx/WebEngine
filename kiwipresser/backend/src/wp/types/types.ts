import './page/page.types'

export interface WPBase {
    id: number;
    date: string;
    modified: string;
    status: string;
    slug: string;
}

export interface RenderedField {
    rendered: string;
}

export type WPCollection<T> = T[];