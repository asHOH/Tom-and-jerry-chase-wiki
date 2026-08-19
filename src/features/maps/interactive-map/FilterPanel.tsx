type FilterPanelProps = {
  hiddenSubtypes: Set<string>;
  subtypes: string[];
  onToggleSubtype: (subtype: string) => void;
};

export default function FilterPanel({
  hiddenSubtypes,
  subtypes,
  onToggleSubtype,
}: FilterPanelProps) {
  if (subtypes.length === 0) return null;

  return (
    <details className='absolute right-3 bottom-3 z-500 max-h-[55%] w-48 overflow-auto rounded-lg bg-slate-900/95 text-sm text-white shadow-xl'>
      <summary className='cursor-pointer px-3 py-2 font-medium'>点位筛选</summary>
      <div className='space-y-2 border-t border-white/10 p-3'>
        <p className='mb-1 text-xs text-white/60'>子类型</p>
        {subtypes.map((subtype) => (
          <label key={subtype} className='flex items-center gap-2 py-0.5'>
            <input
              type='checkbox'
              checked={!hiddenSubtypes.has(subtype)}
              onChange={() => onToggleSubtype(subtype)}
            />
            {subtype}
          </label>
        ))}
      </div>
    </details>
  );
}
