import { createAutoWrapNames } from './createAutoWrapNames';
import { cards, characters } from './static';

export const autoWrapNames = createAutoWrapNames(characters, cards);
