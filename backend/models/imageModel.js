const pool = require("../db/pool");

const ImageModel = {
  async findAll() {
    const result = await pool.query(
      `SELECT i.id, i.title, i.filename, i.created_at,
              u.email AS author_email
       FROM images i
       JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT i.id, i.title, i.filename, i.user_id, i.created_at,
              u.email AS author_email
       FROM images i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(title, filename, userId) {
    const result = await pool.query(
      "INSERT INTO images (title, filename, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, filename, userId]
    );
    return result.rows[0];
  },

  async findByFilename(filename) {
    const result = await pool.query(
      "SELECT * FROM images WHERE filename = $1",
      [filename]
    );
    return result.rows[0] || null;
  },
};

module.exports = ImageModel;
