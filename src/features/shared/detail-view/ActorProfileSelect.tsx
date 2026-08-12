'use client';

import { actorProfiles } from '@/features/actor-profiles';
import { FormSelect } from '@/components/ui/FormControls';

type ActorProfileSelectProps = {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
};

export default function ActorProfileSelect({ value, onChange }: ActorProfileSelectProps) {
  return (
    <label className='flex items-center gap-2 text-sm'>
      <span className='shrink-0'>角色档案:</span>
      <FormSelect
        size='sm'
        value={value ?? ''}
        aria-label='角色档案'
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        <option value=''>不使用角色档案</option>
        {actorProfiles.map((profile) => (
          <option key={profile.name} value={profile.name}>
            {profile.name}
          </option>
        ))}
      </FormSelect>
    </label>
  );
}
