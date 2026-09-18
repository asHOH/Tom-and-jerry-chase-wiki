import type { SingleItem } from '@/data/types';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';

import AttributeSection from './AttributeSection';

type PrototypeVariantSectionProps = {
  prototypes: SingleItem[];
  variants: SingleItem[];
};

export default function PrototypeVariantSection({
  prototypes,
  variants,
}: PrototypeVariantSectionProps) {
  if (prototypes.length === 0 && variants.length === 0) return null;

  return (
    <AttributeSection>
      {prototypes.length > 0 && (
        <div>
          <span className='text-lg font-bold whitespace-pre'>本内容为以下内容的变种：</span>
          <div className='mt-1'>
            <SingleItemAccordionCard items={prototypes} />
          </div>
        </div>
      )}
      {variants.length > 0 && (
        <div className={prototypes.length > 0 ? 'mt-2' : ''}>
          <span className='text-lg font-bold whitespace-pre'>本内容有以下变种：</span>
          <div className='mt-1'>
            <SingleItemAccordionCard items={variants} />
          </div>
        </div>
      )}
    </AttributeSection>
  );
}
