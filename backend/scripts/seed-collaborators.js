require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/services/passwordService');

const OWNER_EMAIL = 'owner-doc@test.fr';
const LINKED_USERS = [
  { email: 'alice-doc@test.fr', firstName: 'Alice', lastName: 'Martin' },
  { email: 'bob-doc@test.fr', firstName: 'Bob', lastName: 'Dupont' },
];
const UNLINKED_USERS = [
  { email: 'charles-doc@test.fr', firstName: 'Charles', lastName: 'Test' },
  { email: 'diana-doc@test.fr', firstName: 'Diana', lastName: 'Libre' },
];
const DEFAULT_PASSWORD = 'MotDePasse123';

async function upsertUser({ email, firstName, lastName, password = DEFAULT_PASSWORD }) {
  const passwordHash = await hashPassword(password);

  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      passwordHash,
    },
    create: {
      email,
      firstName,
      lastName,
      passwordHash,
    },
  });
}

async function ensureDocumentForOwner(ownerId) {
  const name = 'Document de test - Collaborateurs';

  let document = await prisma.document.findFirst({
    where: {
      ownerId,
      name,
    },
  });

  if (!document) {
    document = await prisma.document.create({
      data: {
        name,
        ownerId,
        lastModifiedById: ownerId,
      },
    });
  }

  return document;
}

async function ensurePermission(documentId, userId, level) {
  await prisma.documentPermission.upsert({
    where: {
      documentId_userId: {
        documentId,
        userId,
      },
    },
    create: {
      documentId,
      userId,
      level,
    },
    update: {
      level,
    },
  });
}

async function main() {
  const owner = await upsertUser({
    email: OWNER_EMAIL,
    firstName: 'Owner',
    lastName: 'Document',
  });

  const createdLinkedUsers = [];
  for (const user of LINKED_USERS) {
    const createdUser = await upsertUser(user);
    createdLinkedUsers.push(createdUser);
  }

  for (const user of UNLINKED_USERS) {
    await upsertUser(user);
  }

  const document = await ensureDocumentForOwner(owner.id);

  for (const user of createdLinkedUsers) {
    await ensurePermission(document.id, user.id, user.email.includes('alice') ? 'WRITE' : 'READ');
  }

  const docWithRelations = await prisma.document.findUnique({
    where: { id: document.id },
    include: {
      owner: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      permissions: {
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  const collaboratorNames = [
    `${docWithRelations.owner.firstName} ${docWithRelations.owner.lastName}`,
    ...docWithRelations.permissions.map((permission) =>
      `${permission.user.firstName} ${permission.user.lastName}`
    ),
  ];

  const allUsers = await prisma.user.findMany({
    where: {
      OR: [{ email: { in: [OWNER_EMAIL, ...LINKED_USERS.map((user) => user.email), ...UNLINKED_USERS.map((user) => user.email)] } }],
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  console.log(JSON.stringify({
    documentId: document.id,
    documentName: document.name,
    owner: {
      email: owner.email,
      fullName: `${owner.firstName} ${owner.lastName}`,
    },
    linkedUsers: createdLinkedUsers.map((user) => ({
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
    })),
    unlinkedUsers: UNLINKED_USERS.map((user) => ({
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
    })),
    collaboratorPreview: collaboratorNames,
    allUsers,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Erreur lors du seed de test des collaborateurs:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
