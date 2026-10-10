const { getUserById, updateUser, getAllUsers } = require("../services/userService");

const searchUsers = async (req, res) => {
  try {
    const rawQuery = String(req.query.q ?? '').trim();
    const users = await getAllUsers();
    const query = rawQuery.toLowerCase();

    const filteredUsers = !query
      ? users
      : users.filter((user) => {
          const fullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
          const haystack = `${fullName} ${user.email}`.toLowerCase();
          return haystack.includes(query);
        });

    const payload = filteredUsers.slice(0, 20).map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`.trim(),
    }));

    res.status(200).json({ users: payload });
  } catch (error) {
    console.error("Erreur lors de la recherche des utilisateurs :", error);
    res.status(500).json({ message: "Impossible de récupérer les utilisateurs" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).json({
      message: "Utilisateur authentifié",
      user,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);

    res.status(500).json({
      message: "Erreur lors de la récupération du profil",
    });
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email?.trim() || !firstName?.trim() || !lastName?.trim()) {
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

    const user = await updateUser({
      id: req.user.id,
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    res.status(200).json({
      message: "Profil mis à jour avec succès",
      user,
    });
  } catch (error) {
    console.error("Erreur lors de la modification du profil :", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Cette adresse e-mail est déjà utilisée",
      });
    }

    res.status(500).json({
      message: "Erreur lors de la modification du profil",
    });
  }
};

module.exports = {
  searchUsers,
  getCurrentUser,
  updateCurrentUser,
};
