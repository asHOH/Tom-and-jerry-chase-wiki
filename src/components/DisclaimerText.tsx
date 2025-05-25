import { CREATORS } from '@/constants';

export const DisclaimerText = () => {
  return (
    <>
      本网站为粉丝制作，仅供学习交流使用，并非官方网站。
      <br />
      素材版权均归网易猫和老鼠手游所有。
      <br />
      特别鸣谢b站up主
      <a 
        href={CREATORS.dreamback.url}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline mx-1"
      >
        {CREATORS.dreamback.name}
      </a>
      、
      <a 
        href={CREATORS.momo.url}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline mx-1"
      >
        {CREATORS.momo.name}
      </a>
      提供的{CREATORS.dreamback.contribution}。
      <br />
      特别鸣谢b站up主
      <a 
        href={CREATORS.fanshuwu.url}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline mx-1"
      >
        {CREATORS.fanshuwu.name}
      </a>
      分享的{CREATORS.fanshuwu.contribution}。
    </>
  );
};
