import DailyTraitCard from '@/components/DailyTraitCard';
import OnThisDayCard from '@/components/OnThisDayCard';

export default function TodayHighlightsCard() {
  return (
    <div className='mx-auto grid max-w-4xl gap-4 md:grid-cols-2 md:gap-0'>
      <div className='md:pr-5'>
        <DailyTraitCard embedded />
      </div>
      <div className='border-t border-slate-200/70 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-5 dark:border-slate-800/70'>
        <OnThisDayCard embedded />
      </div>
    </div>
  );
}
