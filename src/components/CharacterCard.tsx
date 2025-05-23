import Image from 'next/image';

type CharacterCardProps = {
  id: string;
  name: string;
  imageUrl: string;
  onClick: (characterId: string) => void;
};

export default function CharacterCard({ id, name, imageUrl, onClick }: CharacterCardProps) {
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
        <h2 className="text-xl font-bold">{name}</h2>
      </div>
    </div>
  );
}
