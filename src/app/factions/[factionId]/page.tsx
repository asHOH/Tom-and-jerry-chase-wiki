import Link from 'next/link';
import { notFound } from 'next/navigation';
import { factions, factionData } from '@/data';

// Generate static params for all factions
export function generateStaticParams() {
  return Object.keys(factionData).map((factionId) => ({
    factionId,
  }));
}

export default async function FactionPage({ params }: { params: Promise<{ factionId: string }> }) {
  const resolvedParams = await params;
  const faction = factions[resolvedParams.factionId];

  if (!faction) {
    notFound();
  }

  return (
    <div className='space-y-8'>
      <div className='flex items-center space-x-4'>
        <Link href='/' className='text-blue-600 hover:underline'>
          &larr; 返回首页
        </Link>
      </div>

      <header className='text-center space-y-4'>
        <h1 className='text-4xl font-bold text-blue-600'>{faction.name}</h1>
        <p className='text-xl text-gray-600'>{faction.description}</p>
      </header>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8'>
        {faction.characters.map((character) => (
          <Link
            key={character.id}
            href={`/characters/${character.id}`}
            className='card flex flex-col items-center hover:border-blue-500 hover:border-2'
          >
            <div className='w-full h-48 bg-gray-200 rounded-t-lg relative overflow-hidden'>
              {/* This would be replaced with actual images */}
              <div className='absolute inset-0 flex items-center justify-center text-4xl'>
                {resolvedParams.factionId === 'cat' ? '🐱' : '🐭'}
              </div>
            </div>
            <div className='p-4 text-center'>
              <h2 className='text-xl font-bold'>{character.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
