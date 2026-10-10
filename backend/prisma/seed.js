
require('dotenv').config();

const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/services/passwordService');

const users = [
  {
    email: 'user.test@dev-fullstack-4.local',
    password: 'UserTest2026!',
    firstName: 'Utilisateur',
    lastName: 'Test',
    role: 'USER'
  },
  {
    email: 'admin.test@dev-fullstack-4.local',
    password: 'AdminTest2026!',
    firstName: 'Administrateur',
    lastName: 'Test',
    role: 'ADMIN'
  }
];

const seedUsers = async () => {
  try {
    for (const userData of users) {
      const passwordHash = await hashPassword(userData.password);

      await prisma.user.upsert({
        where: {
          email: userData.email
        },
        update: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          passwordHash
        },
        create: {
          email: userData.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        }
      });

      console.log(`Utilisateur créé ou mis à jour : ${userData.email}`);
    }
  } catch (error) {
    console.error('Erreur lors du seeding des utilisateurs :', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

seedUsers();
