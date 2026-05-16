import { WPClient } from "./wpclient";

export class WPRead extends WPClient {
  constructor() {
    super();
  }

  async getPosts(params?: {
    perPage?: number;
    page?: number;
    status?: "publish" | "draft" | "private";
    search?: string;
  }) {
    const query = new URLSearchParams();

    if (params?.perPage) query.append("per_page", String(params.perPage));
    if (params?.page) query.append("page", String(params.page));
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";

    return this.request(`/wp/v2/posts${qs}`);
  }

  async getPages(params?: {
    perPage?: number;
    page?: number;
    slug?: string;
    search?: string; 
  }){
    const query = new URLSearchParams();
    if(params?.perPage !== undefined) query.append("per_page", String(params.perPage));
    if(params?.page !== undefined) query.append("page", String(params.page));
    if(params?.slug) query.append("slug", String(params.slug));
    if(params?.search) query.append("search", String(params.search));

    const qs = query.toString() ? `?${query.toString()}` : "";

    return this.request(`wp/v2/pages${qs}`);
  }
}
