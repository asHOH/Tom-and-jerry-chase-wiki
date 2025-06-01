import CharacterDisplay from './CharacterDisplay';
import { FactionWithCharacters, FactionCharactersProps } from '@/lib/types';

export default function CharacterGrid({ faction, onSelectCharacter }: FactionCharactersProps) {
  return (
    <div className="space-y-8"> {/* Padding for navbar is now handled at the page level */}
      <header className="text-center space-y-6 mb-10 px-4">
        <h1 className="text-4xl font-bold text-blue-600 py-3">{faction.name}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto px-4 py-2">{faction.description}</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-8">
        {faction.characters.map((character) => (
          <div key={character.id} className="transform transition-transform hover:-translate-y-1">
            <CharacterDisplay
              id={character.id}
              name={character.name}
              imageUrl={character.imageUrl}
              positioningTags={character.positioningTags}
              factionId={faction.id}
              onClick={onSelectCharacter}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
