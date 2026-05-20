const pool = require("../db/pool");

const ImageModel = {
async findAll() {
  const result = await pool.query(
    `SELECT i.id, i.title, i.image_url AS filename, i.created_at, -- Додали аліас AS filename
            u.email AS author_email
     FROM images i
     JOIN users u ON i.user_id = u.id
     ORDER BY i.created_at DESC`
  );
  return result.rows;
},

async findById(id) {
  const result = await pool.query(
    `SELECT i.id, i.title, i.image_url AS filename, i.user_id, i.created_at, -- Тут теж
            u.email AS author_email
     FROM images i
     JOIN users u ON i.user_id = u.id
     WHERE i.id = $1`,
    [id]
  );
  return result.rows[0] || null;
},

  async create(title, imageUrl, userId) {
    const result = await pool.query(
      "INSERT INTO images (title, image_url, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, imageUrl, userId]
    );
    return result.rows[0];
  }
};

module.exports = ImageModel;