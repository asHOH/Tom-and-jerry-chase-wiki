'use server';

import { DocPage } from '@/features/articles/utils/docs';
import CharacterSection from '@/features/characters/components/character-detail/CharacterSection';

import StyledMDX from '@/components/ui/StyledMDX';

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
