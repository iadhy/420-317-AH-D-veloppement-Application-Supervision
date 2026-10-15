import * as service from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    // Seuls email et password sont lus : meme si le client envoie
    // { "role": "admin" }, il est ignore.
    const { email, password } = req.body;
    res.status(201).json(await service.register({ email, password }));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Ce courriel est deja utilise" });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await service.login({ email, password });

    if (!result) {
      // Meme message dans les deux cas : on ne revele pas si le compte existe.
      return res.status(401).json({ error: "Identifiants invalides" });
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
