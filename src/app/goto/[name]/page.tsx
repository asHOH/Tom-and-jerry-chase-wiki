'use server';

import { redirect, notFound } from 'next/navigation';
import { characters, cards, items, specialSkills } from '@/data';
import { getDocPages } from '@/lib/docUtils';

export default async function GotoPage({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<never> {
  const name = decodeURIComponent((await params).name);
  if (name in characters) {
    redirect(`/characters/${encodeURIComponent(name)}`);
  }
  if (name in cards) {
    redirect(`/cards/${encodeURIComponent(name)}`);
  }
  if (name in items) {
    redirect(`/items/${encodeURIComponent(name)}`);
  }
  if (name in specialSkills['cat']) {
    redirect(`/special-skills/cat/${encodeURIComponent(name)}`);
  }
  if (name in specialSkills['mouse']) {
    redirect(`/special-skills/mouse/${encodeURIComponent(name)}`);
  }
  const docPages = await getDocPages();
  const docPage = docPages.find((page) => page.slug === name || page.title === name);
  if (docPage) {
    redirect(`/docs/${encodeURIComponent(docPage.slug)}`);
  }
  const character = Object.values(characters).find((c) => c.aliases?.includes(name));
  if (character) {
    redirect(`/characters/${encodeURIComponent(character.id)}`);
  }
  const item = Object.values(items).find((i) => i.aliases?.includes(name));
  if (item) {
    redirect(`/items/${encodeURIComponent(item.name)}`);
  }
  const catSkill = Object.values(specialSkills['cat']).find((s) => s.aliases?.includes(name));
  if (catSkill) {
    redirect(`/special-skills/cat/${encodeURIComponent(catSkill.name)}`);
  }
  const mouseSkill = Object.values(specialSkills['mouse']).find((s) => s.aliases?.includes(name));
  if (mouseSkill) {
    redirect(`/special-skills/mouse/${encodeURIComponent(mouseSkill.name)}`);
  }
  const skill = Object.values(characters)
    .flatMap((c) => c.skills)
    .find((skill) => skill.name === name || skill.aliases?.includes(name));
  if (skill) {
    redirect(`/characters/${skill.id.split('-')[0]}#Skill:${encodeURIComponent(skill.name)}`);
  }
  notFound();
}
