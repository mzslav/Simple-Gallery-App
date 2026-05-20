const { CognitoJwtVerifier } = require("aws-jwt-verify");
const UserModel = require("../models/userModel");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID, // Передамо з main.tf
  tokenUse: "id", // Використовуємо id_token, щоб мати доступ до email користувача
  clientId: process.env.COGNITO_CLIENT_ID, // Передамо з main.tf
});

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifier.verify(token);
    
    // 2. Шукаємо користувача в нашій базі (payload.sub - це унікальний ID в Cognito)
    let user = await UserModel.findByCognitoSub(payload.sub);
    
    // 3. Якщо користувача ще немає (перший логін), створюємо запис в Postgres
    if (!user) {
      user = await UserModel.create(payload.sub, payload.email || "user@cognito.com");
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Token validation error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticate;