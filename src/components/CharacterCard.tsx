import Image from 'next/image';
import { PositioningTag } from '@/data';
import { getPositioningTagColor } from '@/lib/cardUtils';

type CharacterCardProps = {
  id: string;
  name: string;
  imageUrl: string;
  positioningTags: PositioningTag[];
  factionId: string;
  onClick: (characterId: string) => void;
};

export default function CharacterCard({ id, name, imageUrl, positioningTags, factionId, onClick }: CharacterCardProps) {
  return (
    <div
      className="card flex flex-col items-center hover:scale-105 transition-all duration-200 cursor-pointer character-card-container p-0 overflow-hidden"
      onClick={() => onClick(id)}
      style={{ transform: 'translateZ(0)' }} // Force hardware acceleration for smoother transitions
    >
      <div className="w-full h-48 bg-gray-200 rounded-t-lg relative overflow-hidden">
        {/* Always show the image, whether it's a real image or a placeholder */}
        <div className="flex items-center justify-center h-full">
          <Image
            src={imageUrl}
            alt={name}
            width={120}
            height={120}
            unoptimized
            style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
          />
        </div>
      </div>
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold px-2 py-2 mb-2">{name}</h2>

        {/* Positioning tags for cat characters */}
        {factionId === 'cat' && positioningTags && positioningTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {positioningTags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded text-xs font-medium ${getPositioningTagColor(tag.tagName, tag.isMinor)}`}
              >
                {tag.tagName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
