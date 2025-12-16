const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addConnects() {
  try {
    const connect = await prisma.connect.create({
      data: {
        amount: 100,
        price: 1000,
        description: '100 Connects Package',
        isActive: true,
        userId: '934d627e-f182-4ef9-abf0-7a8186f4b032'
      }
    });
    console.log('Added connects:', connect);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addConnects(); 