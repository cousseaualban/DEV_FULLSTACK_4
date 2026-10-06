const { createUser, getUserByEmail } = require("../services/userService");
const { verifyPassword } = require("../services/passwordService");
const { generateToken } = require("../services/tokenService");

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (
      !email?.trim() ||
      !password ||
      !firstName?.trim() ||
      !lastName?.trim()
    ) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "L’adresse e-mail est invalide",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l’utilisateur :", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Cette adresse e-mail est déjà utilisée",
      });
    }

    res.status(500).json({
      message: "Erreur lors de la création de l’utilisateur",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "L’e-mail et le mot de passe sont obligatoires",
      });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "E-mail ou mot de passe incorrect",
      });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({
        message: "E-mail ou mot de passe incorrect",
      });
    }

    const token = generateToken(user);

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Ce compte est bloqué",
      });
    }

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isBlocked: user.isBlocked,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);

    res.status(500).json({
      message: "Erreur lors de la connexion",
    });
  }
};

const getCurrentUser = async (req, res) => {
  res.status(200).json({
    message: "Utilisateur authentifié",
    userId: req.user.id,
  });
};

const logout = (req, res) => {
    res.status(200).json({
        message: 'Déconnexion réussie'
    });
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
