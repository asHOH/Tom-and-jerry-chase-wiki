import Image from 'next/image';
import { getRankColor, getCostColor } from '@/lib/cardUtils';

type CardItemProps = {
  id: string;
  name: string;
  rank: string;
  cost: number;
  imageUrl: string;
  onClick: (cardId: string) => void;
};

export default function CardItem({ id, name, rank, cost, imageUrl, onClick }: CardItemProps) {

  return (
    <div
      className="card cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden"
      onClick={() => onClick(id)}
    >
      {/* Card image */}
      <div className="w-full h-48 bg-gray-200 rounded-t-lg relative overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <Image
            src={imageUrl}
            alt={name}
            width={180}
            height={180}
            unoptimized
            style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
            className="transition-transform duration-300 hover:scale-105"
          />
        </div>
      </div>

      {/* Card info */}
      <div className="p-4 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{name}</h3>
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
          <span className={`px-2 py-1 rounded ${getRankColor(rank)}`}>
            {rank}级
          </span>
          <span className={`px-2 py-1 rounded ${getCostColor(cost)}`}>
            {cost}费
          </span>
        </div>
      </div>
    </div>
  );
}
