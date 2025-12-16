const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking for contracts...');
    const contracts = await prisma.contract.findMany({
      include: {
        proposal: {
          include: {
            job: {
              include: {
                client: true
              }
            },
            freelancer: true
          }
        }
      }
    });
    
    console.log(`Found ${contracts.length} contracts`);
    
    if (contracts.length > 0) {
      console.log('Contract details:');
      contracts.forEach((contract, index) => {
        console.log(`\nContract ${index + 1}:`);
        console.log(`ID: ${contract.id}`);
        console.log(`Status: ${contract.status}`);
        console.log(`Client: ${contract.proposal.job.client.name}`);
        console.log(`Freelancer: ${contract.proposal.freelancer.name}`);
        console.log(`Job: ${contract.proposal.job.title}`);
      });
    }
  } catch (error) {
    console.error('Error checking contracts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 