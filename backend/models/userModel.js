const pool = require("../db/pool");

const UserModel = {
  async findByCognitoSub(sub) {
    const result = await pool.query(
      "SELECT * FROM users WHERE cognito_sub = $1",
      [sub]
    );
    return result.rows[0] || null;
  },

  async create(cognitoSub, email) {
    const result = await pool.query(
      "INSERT INTO users (cognito_sub, email) VALUES ($1, $2) RETURNING id, email, created_at",
      [cognitoSub, email]
    );
    return result.rows[0];
  },
};

module.exports = UserModel;