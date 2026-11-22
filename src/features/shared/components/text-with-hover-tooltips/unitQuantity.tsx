import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';

type UnitQuantityProps = {
  text: string;
};

const buildUnitTooltip = (text: string): string => {
  const isRate = /[\/／]\s*(?:秒|s)\s*$/.test(text);

  return `长度单位“单位长”，1米=32单位长。角色脚下阴影的横向长度为100单位长。${isRate ? '“/s”表示每秒。' : ''}`;
};

export default function UnitQuantity({ text }: UnitQuantityProps) {
  return (
    <Tooltip asChild content={buildUnitTooltip(text)}>
      <Link
        href='/mechanics/move'
        className='text-blue-500 underline decoration-1 underline-offset-2 dark:text-sky-300'
      >
        {text}
      </Link>
    </Tooltip>
  );
}
