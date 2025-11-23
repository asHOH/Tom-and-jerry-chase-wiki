'use server';

import { DocPage } from '@/lib/docUtils';
import StyledMDX from '@/components/ui/StyledMDX';
import CharacterSection from '@/components/displays/characters/character-detail/CharacterSection';

function EmptyH1() {
  return null;
}

export default async function CharacterDocs({ docPage }: { docPage: DocPage }) {
  const { default: Component } = await import(`@/app/(main)/docs/${docPage.slug}/page.mdx`);

  return (
    <CharacterSection title='操作技巧' to={`/docs/${encodeURIComponent(docPage.slug)}`}>
      <StyledMDX>
        <Component components={{ h1: EmptyH1 }}></Component>
      </StyledMDX>
    </CharacterSection>
  );
}
