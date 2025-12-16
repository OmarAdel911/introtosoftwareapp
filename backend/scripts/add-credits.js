const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCredits() {
  try {
    const credit = await prisma.credit.create({
      data: {
        amount: 2000,
        type: 'BONUS',
        status: 'ACTIVE',
        userId: 'b095f5a3-0ec0-4090-8c37-6c1551702704',
        description: 'Bonus credits added'
      }
    });

    console.log('Credits added successfully:', credit);
  } catch (error) {
    console.error('Error adding credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCredits(); 