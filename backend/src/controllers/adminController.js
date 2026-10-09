const {
  createUser,
  getAllUsers,
  setUserBlocked,
  setUserRole,
} = require("../services/userService");


const createUserAccount = async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName
        } = req.body;

        if (
            !email?.trim() ||
            !password ||
            !firstName?.trim() ||
            !lastName?.trim()
        ) {
            return res.status(400).json({
                message: 'Tous les champs sont obligatoires'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'L’adresse e-mail est invalide'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères'
            });
        }

        const user = await createUser({
            email: email.trim(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim()
        });

        res.status(201).json({
            message: 'Compte créé avec succès',
            user
        });
    } catch (error) {
        console.error(
            'Erreur lors de la création du compte :',
            error
        );

        if (error.code === 'P2002') {
            return res.status(409).json({
                message: 'Cette adresse e-mail est déjà utilisée'
            });
        }

        res.status(500).json({
            message: 'Erreur lors de la création du compte'
        });
    }
};

const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);

    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
    });
  }
};

const setUserBlockedStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { isBlocked } = req.body;
    if (!Number.isInteger(userId)) {
      return res
        .status(400)
        .json({ message: "Identifiant utilisateur invalide" });
    }
    if (typeof isBlocked !== "boolean") {
      return res
        .status(400)
        .json({ message: "Le statut de blocage doit être un booléen" });
    }
    const user = await setUserBlocked(userId, isBlocked);
    res.status(200).json({
      message: isBlocked
        ? "Utilisateur bloqué avec succès"
        : "Utilisateur débloqué avec succès",
      user,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la modification du statut de blocage :",
      error,
    );
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    res
      .status(500)
      .json({ message: "Erreur lors de la modification du statut de blocage" });
  }
};

const setUserRoleStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;
    if (!Number.isInteger(userId)) {
      return res
        .status(400)
        .json({ message: "Identifiant utilisateur invalide" });
    }
    if (!["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Rôle utilisateur invalide" });
    }
    const user = await setUserRole(userId, role);
    res
      .status(200)
      .json({ message: "Rôle utilisateur modifié avec succès", user });
  } catch (error) {
    console.error(
      "Erreur lors de la modification du rôle utilisateur :",
      error,
    );
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    res
      .status(500)
      .json({ message: "Erreur lors de la modification du rôle utilisateur" });
  }
};

module.exports = {
  createUserAccount,  
  getUsers,
  setUserBlockedStatus,
  setUserRoleStatus,
};
