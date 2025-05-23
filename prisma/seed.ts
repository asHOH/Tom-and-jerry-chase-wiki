import { PrismaClient, SkillType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清除现有数据
  await prisma.skillLevel.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.character.deleteMany();
  await prisma.faction.deleteMany();

  // 创建阵营
  const catFaction = await prisma.faction.create({
    data: {
      name: '猫阵营',
      description: '猫阵营的角色通常拥有更高的攻击力和生命值',
    },
  });

  const mouseFaction = await prisma.faction.create({
    data: {
      name: '鼠阵营',
      description: '鼠阵营的角色通常拥有更高的速度和灵活性',
    },
  });

  // 创建猫阵营角色
  const tom = await prisma.character.create({
    data: {
      name: '汤姆猫',
      factionId: catFaction.id,
      description: '经典角色汤姆猫，擅长追击和控制',
      imageUrl: '/images/tom.jpg',
    },
  });

  // 创建汤姆猫的技能
  const tomActiveSkill = await prisma.skill.create({
    data: {
      name: '猫之爪',
      type: SkillType.ACTIVE,
      description: '向前方发起猛烈攻击',
      characterId: tom.id,
      canMoveWhileUsing: false,
    },
  });

  // 创建汤姆猫主动技能的等级
  await prisma.skillLevel.createMany({
    data: [
      {
        skillId: tomActiveSkill.id,
        level: 1,
        description: '造成100点伤害',
        damage: 100,
        cooldown: 8,
        videoUrl: '/videos/tom-active-1.mp4',
      },
      {
        skillId: tomActiveSkill.id,
        level: 2,
        description: '造成150点伤害',
        damage: 150,
        cooldown: 7,
        videoUrl: '/videos/tom-active-2.mp4',
      },
      {
        skillId: tomActiveSkill.id,
        level: 3,
        description: '造成200点伤害',
        damage: 200,
        cooldown: 6,
        videoUrl: '/videos/tom-active-3.mp4',
      },
    ],
  });

  const tomWeaponSkill = await prisma.skill.create({
    data: {
      name: '捕鼠陷阱',
      type: SkillType.WEAPON,
      description: '放置一个陷阱，踩到的老鼠会被困住',
      characterId: tom.id,
      canMoveWhileUsing: true,
    },
  });

  await prisma.skillLevel.createMany({
    data: [
      {
        skillId: tomWeaponSkill.id,
        level: 1,
        description: '困住2秒',
        cooldown: 15,
        videoUrl: '/videos/tom-weapon-1.mp4',
      },
      {
        skillId: tomWeaponSkill.id,
        level: 2,
        description: '困住3秒',
        cooldown: 13,
        videoUrl: '/videos/tom-weapon-2.mp4',
      },
      {
        skillId: tomWeaponSkill.id,
        level: 3,
        description: '困住4秒',
        cooldown: 10,
        videoUrl: '/videos/tom-weapon-3.mp4',
      },
    ],
  });

  const tomPassiveSkill = await prisma.skill.create({
    data: {
      name: '猫的敏捷',
      type: SkillType.PASSIVE,
      description: '提高移动速度',
      characterId: tom.id,
      canMoveWhileUsing: true,
    },
  });

  await prisma.skillLevel.createMany({
    data: [
      {
        skillId: tomPassiveSkill.id,
        level: 1,
        description: '移动速度提高10%',
      },
      {
        skillId: tomPassiveSkill.id,
        level: 2,
        description: '移动速度提高15%',
      },
      {
        skillId: tomPassiveSkill.id,
        level: 3,
        description: '移动速度提高20%',
      },
    ],
  });

  // 创建鼠阵营角色
  const jerry = await prisma.character.create({
    data: {
      name: '杰瑞',
      factionId: mouseFaction.id,
      description: '经典角色杰瑞，擅长逃跑和设置陷阱',
      imageUrl: '/images/jerry.jpg',
    },
  });

  // 创建杰瑞的技能
  const jerryActiveSkill = await prisma.skill.create({
    data: {
      name: '鼠标冲刺',
      type: SkillType.ACTIVE,
      description: '快速冲刺一段距离',
      characterId: jerry.id,
      canMoveWhileUsing: true,
    },
  });

  await prisma.skillLevel.createMany({
    data: [
      {
        skillId: jerryActiveSkill.id,
        level: 1,
        description: '冲刺3米',
        cooldown: 10,
        videoUrl: '/videos/jerry-active-1.mp4',
      },
      {
        skillId: jerryActiveSkill.id,
        level: 2,
        description: '冲刺4米',
        cooldown: 9,
        videoUrl: '/videos/jerry-active-2.mp4',
      },
      {
        skillId: jerryActiveSkill.id,
        level: 3,
        description: '冲刺5米',
        cooldown: 8,
        videoUrl: '/videos/jerry-active-3.mp4',
      },
    ],
  });

  console.log('数据库种子数据创建成功');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
