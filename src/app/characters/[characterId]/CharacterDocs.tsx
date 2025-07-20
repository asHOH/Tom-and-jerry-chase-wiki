'use server';
import StyledMDX from '@/components/ui/StyledMDX';
import { DocPage } from '@/lib/docUtils';

function EmptyH1() {
  return null;
}

export default async function CharacterDocs({ docPage }: { docPage: DocPage }) {
  const { default: Component } = await import(`@/app/docs/${docPage.slug}/page.mdx`);

  return (
    <StyledMDX>
      <Component components={{ h1: EmptyH1 }}></Component>
    </StyledMDX>
  );
}
