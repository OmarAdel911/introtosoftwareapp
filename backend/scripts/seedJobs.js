const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed fake jobs...');

  // First, create a client user if it doesn't exist
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      name: 'Sample Client',
      email: 'client@example.com',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9mG', // password: password123
      role: 'CLIENT',
      bio: 'A sample client for testing purposes',
      skills: ['Project Management', 'Communication'],
      location: 'New York, USA',
    },
  });

  console.log(`Created client user: ${client.name}`);

  // Create a variety of jobs
  const jobs = [
    {
      title: 'E-commerce Website Development',
      description: 'Need a full-stack developer to build an e-commerce website with product catalog, shopping cart, and payment integration. The website should be responsive and user-friendly.',
      budget: 2500,
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript'],
      category: 'Web Development',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'Mobile App for Food Delivery',
      description: 'Looking for a mobile app developer to create a food delivery app for iOS and Android. The app should include user authentication, restaurant listings, menu browsing, order placement, and real-time order tracking.',
      budget: 5000,
      skills: ['React Native', 'Firebase', 'Redux', 'JavaScript', 'Mobile Development'],
      category: 'Mobile Development',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'Logo and Brand Identity Design',
      description: 'Need a creative designer to develop a logo and brand identity for our new tech startup. The design should be modern, minimalist, and convey innovation and reliability.',
      budget: 800,
      skills: ['Logo Design', 'Branding', 'Adobe Illustrator', 'Adobe Photoshop', 'Typography'],
      category: 'Graphic Design',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'Content Writing for Tech Blog',
      description: 'Looking for a tech-savvy content writer to create 10 high-quality blog posts about emerging technologies. Topics will include AI, blockchain, and IoT. Each post should be 1500-2000 words with proper research and citations.',
      budget: 1200,
      skills: ['Content Writing', 'Technical Writing', 'SEO', 'Research', 'Blog Writing'],
      category: 'Content Writing',
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'Data Analysis and Visualization',
      description: 'Need a data analyst to analyze our sales data and create visualizations to help us understand trends and make better business decisions. The project involves cleaning data, performing statistical analysis, and creating interactive dashboards.',
      budget: 1800,
      skills: ['Data Analysis', 'Python', 'Pandas', 'Matplotlib', 'Tableau', 'SQL'],
      category: 'Data Science',
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'Social Media Marketing Campaign',
      description: 'Looking for a social media expert to run a 3-month marketing campaign for our new product launch. The campaign should include content creation, community management, paid advertising, and performance tracking.',
      budget: 3000,
      skills: ['Social Media Marketing', 'Content Creation', 'Facebook Ads', 'Instagram Marketing', 'Analytics'],
      category: 'Digital Marketing',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'Video Editing for YouTube Channel',
      description: 'Need a video editor to edit and enhance our YouTube videos. The editor should be able to add graphics, transitions, music, and optimize videos for engagement. We produce 2 videos per week.',
      budget: 1500,
      skills: ['Video Editing', 'Adobe Premiere Pro', 'After Effects', 'Color Grading', 'Motion Graphics'],
      category: 'Video & Animation',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'WordPress Website Customization',
      description: 'Looking for a WordPress developer to customize our existing website. Tasks include adding custom functionality, improving page speed, implementing SEO best practices, and ensuring mobile responsiveness.',
      budget: 950,
      skills: ['WordPress', 'PHP', 'CSS', 'JavaScript', 'SEO', 'Responsive Design'],
      category: 'Web Development',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'Translation Services (English to Spanish)',
      description: 'Need a professional translator to translate our website content from English to Spanish. The project includes approximately 10,000 words of technical content related to software development.',
      budget: 750,
      skills: ['Translation', 'English to Spanish', 'Technical Writing', 'Localization', 'Proofreading'],
      category: 'Translation',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      clientId: client.id,
      status: 'OPEN',
    },
    {
      title: 'UI/UX Design for SaaS Platform',
      description: 'Looking for a UI/UX designer to create wireframes and high-fidelity designs for our SaaS platform. The design should focus on user experience, accessibility, and modern design principles.',
      budget: 2200,
      skills: ['UI Design', 'UX Design', 'Figma', 'Wireframing', 'Prototyping', 'User Research'],
      category: 'UI/UX Design',
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
      clientId: client.id,
      status: 'OPEN',
    }
  ];

  // Insert all jobs
  for (const job of jobs) {
    const createdJob = await prisma.job.create({
      data: job
    });
    console.log(`Created job: ${createdJob.title}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding jobs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 