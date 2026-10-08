const {
  createUser,
  getUserByIdWithPassword,
  getUserByEmailWithPassword,
  getUserById,
  updatePassword,
  setTwoFactorSecret,
  getUserTwoFactorSecret,
  enableTwoFactor
} = require("../services/userService");
const { verifyPassword, hashPassword } = require("../services/passwordService");
const { generateToken, generateTwoFactorToken, verifyTwoFactorToken } = require("../services/tokenService");
const {
    createSecret,
    generateOtpAuthUrl,
    verifyCode
} = require('../services/twoFactorService');

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

    const user = await getUserByEmailWithPassword(email);

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

    if (user.isBlocked) {
        return res.status(403).json({
            message: 'Compte bloqué'
        });
    }

    if (user.twoFactorEnabled) {
        const twoFactorToken = generateTwoFactorToken(user);

        return res.status(200).json({
            message: 'Code 2FA requis',
            twoFactorRequired: true,
            token: twoFactorToken
        });
    }

    const token = generateToken(user);

    res.status(200).json({
        message: 'Connexion réussie',
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isBlocked: user.isBlocked,
            twoFactorEnabled: user.twoFactorEnabled
        }
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);

    res.status(500).json({
      message: "Erreur lors de la connexion",
    });
  }
};

const loginTwoFactor = async (req, res) => {
    try {
        const {
            token,
            code
        } = req.body;

        if (!token || !code) {
            return res.status(400).json({
                message: 'Token 2FA et code 2FA obligatoires'
            });
        }

        const decodedToken = verifyTwoFactorToken(token);

        const user = await getUserById(
            decodedToken.userId
        );

        if (!user) {
            return res.status(404).json({
                message: 'Utilisateur introuvable'
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                message: 'Compte bloqué'
            });
        }

        const twoFactorData = await getUserTwoFactorSecret(
            decodedToken.userId
        );

        if (!twoFactorData?.twoFactorSecret) {
            return res.status(400).json({
                message: 'La configuration de la double authentification est incomplète'
            });
        }

        const valid = await verifyCode({
            code,
            secret: twoFactorData.twoFactorSecret
        });

        if (!valid) {
            return res.status(401).json({
                message: 'Code 2FA invalide'
            });
        }

        const accessToken = generateToken(user);

        res.status(200).json({
            message: 'Connexion réussie',
            token: accessToken,
            user
        });
    } catch (error) {
        console.error(
            'Erreur lors de la validation du 2FA de connexion :',
            error
        );

        res.status(401).json({
            message: 'Token 2FA invalide ou expiré'
        });
    }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "L’ancien et le nouveau mot de passe sont obligatoires",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "Le nouveau mot de passe doit être différent de l’ancien",
      });
    }

    const user = await getUserByIdWithPassword(req.user.id);

    if (!user) {
        return res.status(404).json({
            message: "Utilisateur introuvable",
        });
    }

    const passwordValid = await verifyPassword(
        currentPassword,
        user.passwordHash,
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "L’ancien mot de passe est incorrect",
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await updatePassword(req.user.id, passwordHash);

    res.status(200).json({
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la modification du mot de passe :", error);

    res.status(500).json({
      message: "Erreur lors de la modification du mot de passe",
    });
  }
};

const setupTwoFactor = async (req, res) => {
    try {
        const user = await getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Utilisateur introuvable'
            });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                message: 'La double authentification est déjà activée'
            });
        }

        const secret = createSecret();

        await setTwoFactorSecret(
            req.user.id,
            secret
        );

        const otpAuthUrl = generateOtpAuthUrl({
            email: user.email,
            secret
        });

        res.status(200).json({
            message: 'Configuration de la double authentification générée',
            otpAuthUrl
        });
    } catch (error) {
        console.error(
            'Erreur lors de la configuration de la double authentification :',
            error
        );

        res.status(500).json({
            message: 'Erreur lors de la configuration de la double authentification'
        });
    }
};

const verifyTwoFactor = async (req, res) => {
    try {
        const {
            code
        } = req.body;

        if (!code) {
            return res.status(400).json({
                message: 'Le code 2FA est obligatoire'
            });
        }

        const user = await getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Utilisateur introuvable'
            });
        }

        const twoFactorData = await getUserTwoFactorSecret(req.user.id);

        if (!twoFactorData?.twoFactorSecret) {
            return res.status(400).json({
                message: 'La configuration de la double authentification est incomplète'
            });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                message: 'La double authentification est déjà activée'
            });
        }

        const valid = await verifyCode({
            code,
            secret: twoFactorData.twoFactorSecret
        });


        if (!valid) {
            return res.status(401).json({
                message: 'Code 2FA invalide'
            });
        }

        const updatedUser = await enableTwoFactor(
            req.user.id
        );

        res.status(200).json({
            message: 'Double authentification activée avec succès',
            user: updatedUser
        });
    } catch (error) {
        console.error(
            'Erreur lors de la validation de la double authentification :',
            error
        );

        res.status(500).json({
            message: 'Erreur lors de la validation de la double authentification'
        });
    }
};

const logout = (req, res) => {
  res.status(200).json({
    message: "Déconnexion réussie",
  });
};

module.exports = {
  register,
  login,
  loginTwoFactor,
  changePassword,
  setupTwoFactor,
  verifyTwoFactor,
  logout,
};
