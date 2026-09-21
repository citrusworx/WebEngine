export type DocHeading = {
  id: string;
  text: string;
  level: number;
};

export type DocPage = {
  id: string;
  title: string;
  filename: string;
  href: string;
  html: string;
  toc: DocHeading[];
  group: string;
};

export type DocNavItem = {
  id: string;
  title: string;
  href: string;
  filename: string;
};

export type DocNavGroup = {
  id: string;
  label: string;
  items: DocNavItem[];
};

export type DocsCatalog = {
  version: string;
  defaultPageId: string;
  pages: Record<string, DocPage>;
  nav: DocNavGroup[];
};
