/**
 * Seeder — populates or clears the database with demo data.
 *
 * Usage:
 *   npm run seed            → import data
 *   npm run seed:destroy    → delete all data
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose    = require('mongoose');
const bcrypt      = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const User        = require('../models/User');
const Project     = require('../models/Project');
const Transaction = require('../models/Transaction');

// ── Demo users ────────────────────────────────────────────
const usersData = [
  { name: 'Aria Chen',     email: 'buyer@demo.com',   password: 'demo123', role: 'buyer'  },
  { name: 'Marco Reyes',   email: 'seller@demo.com',  password: 'demo123', role: 'seller' },
  { name: 'Sam Kowalski',  email: 'admin@demo.com',   password: 'demo123', role: 'admin'  },
  { name: 'Elena Vasquez', email: 'buyer2@demo.com',  password: 'demo123', role: 'buyer'  },
  { name: 'David Okafor',  email: 'seller2@demo.com', password: 'demo123', role: 'seller' },
];

// ── Projects (seller index used to assign seller after user creation) ──
const projectsData = (sellers) => [
  {
    seller:         sellers[0]._id,
    title:          'Amazon Rainforest Conservation',
    description:    'Protecting 50,000 hectares of primary rainforest in Brazil\'s Pará state. This project prevents deforestation through community-based land management and provides sustainable livelihoods for 3,000+ indigenous families.',
    location:       'Pará, Brazil',
    impactType:     'Forest Conservation',
    totalCredits:   15000,
    availableCredits: 12450,
    pricePerCredit: 28.50,
    emoji:          '🌿',
    status:         'verified',
    verifiedAt:     new Date('2024-01-22'),
  },
  {
    seller:         sellers[0]._id,
    title:          'Kenyan Wind Farm Initiative',
    description:    '200 MW wind energy installation replacing diesel generators across rural Kenya. Directly displaces 180,000 tons of CO₂ annually while providing clean electricity to 400,000 households.',
    location:       'Turkana, Kenya',
    impactType:     'Renewable Energy',
    totalCredits:   10000,
    availableCredits: 8200,
    pricePerCredit: 22.00,
    emoji:          '💨',
    status:         'verified',
    verifiedAt:     new Date('2024-01-27'),
  },
  {
    seller:         sellers[1]._id,
    title:          'Mekong Delta Mangrove Restoration',
    description:    'Restoring 8,000 hectares of degraded mangrove forests across Vietnam\'s coastline. Sequesters carbon while protecting coastal communities from storm surges and supporting biodiversity.',
    location:       'Mekong Delta, Vietnam',
    impactType:     'Blue Carbon',
    totalCredits:   7000,
    availableCredits: 5600,
    pricePerCredit: 35.00,
    emoji:          '🌊',
    status:         'verified',
    verifiedAt:     new Date('2024-02-03'),
  },
  {
    seller:         sellers[1]._id,
    title:          'Himalayan Solar Cookstoves',
    description:    'Distributing efficient solar cookstoves to 50,000 households in Nepal and Bhutan, replacing traditional biomass burning. Reduces indoor air pollution while cutting CO₂ emissions.',
    location:       'Nepal & Bhutan',
    impactType:     'Clean Cooking',
    totalCredits:   5000,
    availableCredits: 3800,
    pricePerCredit: 18.75,
    emoji:          '☀️',
    status:         'pending',
  },
  {
    seller:         sellers[0]._id,
    title:          'Patagonian Peat Bog Protection',
    description:    'Conserving 30,000 hectares of carbon-rich peatlands in Chile\'s Los Lagos region. Peat bogs are among the most carbon-dense ecosystems on Earth, storing twice as much carbon as forests.',
    location:       'Los Lagos, Chile',
    impactType:     'Peatland Conservation',
    totalCredits:   10000,
    availableCredits: 9100,
    pricePerCredit: 42.00,
    emoji:          '🏔️',
    status:         'verified',
    verifiedAt:     new Date('2024-02-17'),
  },
  {
    seller:         sellers[1]._id,
    title:          'Borneo Orangutan Habitat Fund',
    description:    'Protecting and reforesting 25,000 hectares of critical orangutan habitat in East Kalimantan. Combines carbon sequestration with biodiversity conservation and anti-poaching programs.',
    location:       'East Kalimantan, Indonesia',
    impactType:     'Biodiversity Conservation',
    totalCredits:   8000,
    availableCredits: 6750,
    pricePerCredit: 31.00,
    emoji:          '🦧',
    status:         'pending',
  },
];

// ── Seed transactions (after projects created) ────────────
const transactionsData = (buyers, sellers, projects) => [
  { buyer: buyers[0]._id, seller: sellers[0]._id, project: projects[0]._id, projectTitle: projects[0].title, creditsPurchased: 100,  pricePerCredit: 28.50, totalAmount: 2850  },
  { buyer: buyers[0]._id, seller: sellers[0]._id, project: projects[1]._id, projectTitle: projects[1].title, creditsPurchased: 50,   pricePerCredit: 22.00, totalAmount: 1100  },
  { buyer: buyers[1]._id, seller: sellers[1]._id, project: projects[2]._id, projectTitle: projects[2].title, creditsPurchased: 200,  pricePerCredit: 35.00, totalAmount: 7000  },
  { buyer: buyers[0]._id, seller: sellers[1]._id, project: projects[2]._id, projectTitle: projects[2].title, creditsPurchased: 75,   pricePerCredit: 35.00, totalAmount: 2625  },
  { buyer: buyers[1]._id, seller: sellers[0]._id, project: projects[4]._id, projectTitle: projects[4].title, creditsPurchased: 30,   pricePerCredit: 42.00, totalAmount: 1260  },
  { buyer: buyers[0]._id, seller: sellers[0]._id, project: projects[0]._id, projectTitle: projects[0].title, creditsPurchased: 200,  pricePerCredit: 28.50, totalAmount: 5700  },
];

// ── Import ────────────────────────────────────────────────
const importData = async () => {
  await connectDB();
  try {
    // Clear existing
    await User.deleteMany();
    await Project.deleteMany();
    await Transaction.deleteMany();

    // Hash passwords manually (model hook won't fire on insertMany)
    const salt     = await bcrypt.genSalt(12);
    const hashedUsers = await Promise.all(
      usersData.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, salt),
      }))
    );
    const createdUsers = await User.insertMany(hashedUsers);

    const buyers  = createdUsers.filter(u => u.role === 'buyer');
    const sellers = createdUsers.filter(u => u.role === 'seller');
    const admin   = createdUsers.find(u => u.role === 'admin');

    const createdProjects = await Project.insertMany(projectsData(sellers));

    // Mark verifiedBy for verified projects
    await Promise.all(
      createdProjects
        .filter(p => p.status === 'verified')
        .map(p => Project.findByIdAndUpdate(p._id, { verifiedBy: admin._id }))
    );

    await Transaction.insertMany(transactionsData(buyers, sellers, createdProjects));

    console.log('✅ Database seeded successfully!');
    console.log(`   Users:        ${createdUsers.length}`);
    console.log(`   Projects:     ${createdProjects.length}`);
    console.log(`   Transactions: ${(transactionsData(buyers, sellers, createdProjects)).length}`);
    console.log('\n   Demo credentials (all passwords: demo123)');
    console.log('   buyer@demo.com  /  seller@demo.com  /  admin@demo.com');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await disconnectDB();
    process.exit();
  }
};

// ── Destroy ───────────────────────────────────────────────
const destroyData = async () => {
  await connectDB();
  try {
    await User.deleteMany();
    await Project.deleteMany();
    await Transaction.deleteMany();
    console.log('🗑️  All data destroyed');
  } catch (err) {
    console.error('❌ Destroy failed:', err.message);
  } finally {
    await disconnectDB();
    process.exit();
  }
};

// ── CLI ───────────────────────────────────────────────────
if (process.argv.includes('--destroy')) {
  destroyData();
} else {
  importData();
}
