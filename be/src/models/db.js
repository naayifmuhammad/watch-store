const { getPool } = require('../config/database');

class Database {
  static async query(sql, params = []) {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
  
  static async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }
  
  static async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    return result.insertId;
  }
  
  static async update(table, data, where, whereParams = []) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = await this.query(sql, [...values, ...whereParams]);
    return result.affectedRows;
  }
  
  static async delete(table, where, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.query(sql, whereParams);
    return result.affectedRows;
  }
}

module.exports = Database;
