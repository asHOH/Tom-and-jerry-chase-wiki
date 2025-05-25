import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清除现有数据
  await prisma.skillLevel.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.character.deleteMany();
  await prisma.faction.deleteMany();

  console.log('数据库表已清空');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
