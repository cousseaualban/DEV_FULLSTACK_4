const prisma = require("../config/prisma");

const { hashPassword } = require("./passwordService");


const userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isBlocked: true,
    twoFactorEnabled: true,
    createdAt: true,
    updatedAt: true
};

const createUser = async ({ email, password, firstName, lastName }) => {
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
    },
    select: userSelect
  });

  return user;
};

const getUserByEmailWithPassword = async (email) => {
    return prisma.user.findUnique({
        where: {
            email
        },
        select: {
            id: true,
            email: true,
            passwordHash: true,
            firstName: true,
            lastName: true,
            role: true,
            isBlocked: true,
            twoFactorEnabled: true
        }
    });
};

const getUserByIdWithPassword = async (id) => {
    return prisma.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            email: true,
            passwordHash: true
        }
    });
};

const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: userSelect
  });
};

const getUserTwoFactorSecret = async (id) => {
    return prisma.user.findUnique({
        where: {
            id
        },
        select: {
            twoFactorSecret: true,
            twoFactorEnabled: true
        }
    });
};

const updateUser = async ({ id, email, firstName, lastName }) => {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      email,
      firstName,
      lastName,
    },
    select: userSelect
  });
};

const updatePassword = async (id, passwordHash) => {
    return prisma.user.update({
        where: {
            id
        },
        data: {
            passwordHash
        }
    });
};

const setTwoFactorSecret = async (id, twoFactorSecret) => {
    return prisma.user.update({
        where: {
            id
        },
        data: {
            twoFactorSecret
        }
    });
};

const enableTwoFactor = async (id) => {
    return prisma.user.update({
        where: {
            id
        },
        data: {
            twoFactorEnabled: true
        },
        select: userSelect
    });
};

module.exports = {
  createUser,
  getUserByEmailWithPassword,
  getUserByIdWithPassword,
  getUserById,
  getUserTwoFactorSecret,
  updateUser,
  updatePassword,
  setTwoFactorSecret,
  enableTwoFactor
};
