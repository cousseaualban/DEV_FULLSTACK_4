const prisma = require("../config/prisma");

const { hashPassword } = require("./passwordService");

const createUser = async ({ email, password, firstName, lastName }) => {
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isBlocked: true,
      twoFactorEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

const getUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where: {
            email
        }
    });
};

module.exports = {
  createUser,
  getUserByEmail
};
