import useSWR from 'swr';
import { GameDataManager } from './dataManager';

const fetcher = (key: string) => {
  switch (key) {
    case 'factions':
      return GameDataManager.getFactions();
    case 'characters':
      return GameDataManager.getCharacters();
    case 'factionCards':
      return GameDataManager.getFactionCards();
    case 'cards':
      return GameDataManager.getCards();
    default:
      throw new Error('Unknown data key');
  }
};

export function useFactions() {
  return useSWR('factions', fetcher);
}

export function useCharacters() {
  return useSWR('characters', fetcher);
}

export function useFactionCards() {
  return useSWR('factionCards', fetcher);
}

export function useCards() {
  return useSWR('cards', fetcher);
}
