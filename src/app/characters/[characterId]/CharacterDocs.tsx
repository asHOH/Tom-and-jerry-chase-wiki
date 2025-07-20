'use server';
import StyledMDX from '@/components/ui/StyledMDX';
import { getDocPages } from '@/lib/docUtils';

function EmptyH1() {
  return null;
}

export default async function CharacterDocs({ id }: { id: string }) {
  const docPages = await getDocPages();
  const page = docPages.find((page) => page.title == `${id}玩法指导`);
  if (!page) {
    return null;
  }
  const { default: Component } = await import(`@/app/docs/${page.slug}/page.mdx`);

  return (
    <StyledMDX>
      <Component components={{ h1: EmptyH1 }}></Component>
    </StyledMDX>
  );
}
