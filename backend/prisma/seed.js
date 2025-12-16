const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      skills: ['Administration', 'Management'],
      hourlyRate: 50,
      location: 'New York, USA',
    },
  });

  // Create client user
  const clientPassword = await bcrypt.hash('client123', 10);
  const client = await prisma.user.create({
    data: {
      email: 'client@example.com',
      password: clientPassword,
      name: 'John Client',
      role: 'CLIENT',
      skills: ['Project Management'],
      location: 'London, UK',
    },
  });

  // Create freelancer user
  const freelancerPassword = await bcrypt.hash('freelancer123', 10);
  const freelancer = await prisma.user.create({
    data: {
      email: 'freelancer@example.com',
      password: freelancerPassword,
      name: 'Jane Freelancer',
      role: 'FREELANCER',
      skills: ['React', 'Node.js', 'TypeScript'],
      hourlyRate: 35,
      location: 'Berlin, Germany',
      bio: 'Experienced full-stack developer with 5 years of experience',
    },
  });

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Web Development Project',
        description: 'Need a responsive website built with React and Node.js',
        budget: 1500,
        skills: ['React', 'Node.js', 'TypeScript'],
        category: 'Web Development',
        deadline: new Date('2024-12-31'),
        clientId: client.id,
        status: 'OPEN',
      },
    }),
    prisma.job.create({
      data: {
        title: 'Mobile App Development',
        description: 'Looking for a developer to create an iOS app',
        budget: 2500,
        skills: ['iOS', 'Swift', 'Mobile Development'],
        category: 'Mobile Development',
        deadline: new Date('2024-12-31'),
        clientId: client.id,
        status: 'OPEN',
      },
    }),
  ]);

  // Create sample proposals
  const proposals = await Promise.all([
    prisma.proposal.create({
      data: {
        coverLetter: 'I have extensive experience with React and Node.js',
        amount: 1500,
        status: 'PENDING',
        jobId: jobs[0].id,
        freelancerId: freelancer.id,
      },
    }),
    prisma.proposal.create({
      data: {
        coverLetter: 'I specialize in iOS development with Swift',
        amount: 2500,
        status: 'ACCEPTED',
        jobId: jobs[1].id,
        freelancerId: freelancer.id,
      },
    }),
  ]);

  // Create sample payment
  const payment = await prisma.payment.create({
    data: {
      amount: 1500,
      status: 'PENDING',
      method: 'CREDIT_CARD',
      jobId: jobs[0].id,
      userId: client.id,
      freelancerId: freelancer.id,
    },
  });

  // Create sample portfolio items
  const portfolio = await prisma.portfolio.create({
    data: {
      title: 'E-commerce Website',
      description: 'A full-stack e-commerce platform built with React and Node.js',
      imageUrl: 'https://example.com/portfolio1.jpg',
      projectUrl: 'https://example.com/project1',
      userId: freelancer.id,
    },
  });

  console.log('Seed data created successfully:');
  console.log('Admin:', admin);
  console.log('Client:', client);
  console.log('Freelancer:', freelancer);
  console.log('Jobs:', jobs);
  console.log('Proposals:', proposals);
  console.log('Payment:', payment);
  console.log('Portfolio:', portfolio);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 