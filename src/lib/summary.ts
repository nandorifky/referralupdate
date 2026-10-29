import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

/**
 * Render the short `summary` frontmatter block, which may mix a paragraph with
 * a bullet list. Only the same Markdown subset as article bodies is supported.
 */
export async function summaryHtml(markdown: string | undefined) {
  const source = markdown?.trim();
  if (!source) return undefined;
  const file = await processor.process(source);
  return String(file);
}
