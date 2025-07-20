import { useLocalCharacter } from '@/context/EditModeContext';
import { characters, specialSkills } from '@/data';
import Image from 'next/image';
import Link from 'next/link';
import { useSnapshot } from 'valtio';

export default function SpecialSkillsSection() {
  const { characterId } = useLocalCharacter();
  const character = useSnapshot(characters[characterId]!);
  return (
    <div>
      <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3'>推荐特技</h3>
      <ul className='flex flex-col items-center gap-2'>
        {(character.specialSkills ?? []).map((skill) => {
          const specialSkill = specialSkills[character.factionId!][skill.name];
          if (!specialSkill) return null;
          return (
            <li
              key={skill.name}
              className='w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
            >
              <Link
                href={`/special-skills/${character.factionId}/${skill.name}`}
                className='flex items-center gap-2'
              >
                <Image
                  src={specialSkill.imageUrl}
                  alt={skill.name}
                  className='w-6 h-6 rounded-full'
                  width={24}
                  height={24}
                />
                <span className='font-semibold text-base'>{skill.name}</span>
                <span className='ml-2 text-sm text-gray-500 dark:text-gray-300'>
                  {skill.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
