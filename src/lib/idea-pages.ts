import { validPageData, type PageData } from "./page-fields.ts";
export type BlockKind = "text" | "heading" | "list" | "check";
export type Block = {
  id: string;
  kind: BlockKind;
  text: string;
  depth: number;
  done: boolean;
  column: number;
  bold: boolean;
};
export type IdeaPage = {
  id: string;
  parent: string | null;
  title: string;
  columns: number;
  blocks: Block[];
  data?: PageData;
};
export const BLOCK_TYPES: Record<BlockKind, string> = {
  text: "Text",
  heading: "Titlu",
  list: "Element de listă",
  check: "Listă de bifat",
};

export function validPages(pages: IdeaPage[]): boolean {
  if (!Array.isArray(pages) || pages.length > 100) return false;
  const index = new Map<string, IdeaPage>();
  for (const page of pages) {
    if (
      !page ||
      typeof page.id !== "string" ||
      !page.id ||
      index.has(page.id) ||
      typeof page.title !== "string" ||
      !page.title.trim() ||
      page.title.length > 200 ||
      ![1, 2, 3].includes(page.columns) ||
      (page.data !== undefined && !validPageData(page.data)) ||
      !Array.isArray(page.blocks) ||
      page.blocks.length > 200
    )
      return false;
    const ids = new Set<string>();
    for (const b of page.blocks) {
      if (
        !b ||
        typeof b.id !== "string" ||
        ids.has(b.id) ||
        !Object.hasOwn(BLOCK_TYPES, b.kind) ||
        typeof b.text !== "string" ||
        b.text.length > 5000 ||
        typeof b.done !== "boolean" ||
        typeof b.bold !== "boolean" ||
        ![0, 1, 2].includes(b.depth) ||
        !Number.isInteger(b.column) ||
        b.column < 0 ||
        b.column >= page.columns
      )
        return false;
      ids.add(b.id);
    }
    index.set(page.id, page);
  }
  for (const page of pages) {
    const seen = new Set([page.id]);
    let parent = page.parent;
    while (parent !== null) {
      if (seen.has(parent) || seen.size >= 8) return false;
      const found = index.get(parent);
      if (!found) return false;
      seen.add(parent);
      parent = found.parent;
    }
  }
  return true;
}
