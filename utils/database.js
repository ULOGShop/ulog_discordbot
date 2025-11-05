import mysql from "mysql2/promise"

let pool = null

export async function initDatabase() {
    try {
        const tempPool = mysql.createPool({host: process.env.DB_HOST || "localhost", port: process.env.DB_PORT || 3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD, waitForConnections: true, connectionLimit: 10, queueLimit: 0})
        const tempConnection = await tempPool.getConnection()
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
        tempConnection.release()
        await tempPool.end()
        pool = mysql.createPool({host: process.env.DB_HOST || "localhost", port: process.env.DB_PORT || 3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10, queueLimit: 0})
        const connection = await pool.getConnection()
        await createTables(connection)
        connection.release()
        return pool
    } catch (error) {
        throw error
    }
}

async function createTables(connection) {
    const createReviewsTable = `
        CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transaction_id VARCHAR(255) UNIQUE NOT NULL,
            payment_id VARCHAR(255),
            user_id VARCHAR(255) NOT NULL,
            user_username VARCHAR(255) NOT NULL,
            user_avatar TEXT,
            product_id VARCHAR(255) NOT NULL,
            product_name VARCHAR(500) NOT NULL,
            product_image TEXT,
            review_description TEXT NOT NULL,
            rating INT NOT NULL,
            message_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_transaction_id (transaction_id),
            INDEX idx_user_id (user_id),
            INDEX idx_product_id (product_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
    await connection.query(createReviewsTable)
}

/**
 * Check if transaction ID was already used
 * @param {string} transactionId - Transaction ID to check
 * @returns {Promise<boolean>} True if already used
 */
export async function isTransactionUsed(transactionId) {
    try {
        const [rows] = await pool.query("SELECT id FROM reviews WHERE transaction_id = ? LIMIT 1", [transactionId])
        return rows.length > 0
    } catch (error) {
        throw error
    }
}

/**
 * Save a new review to database
 * @param {object} reviewData - Review data
 * @returns {Promise<object>} Saved review data
 */
export async function saveReview(reviewData) {
    try {
        const {transactionId, paymentId, userId, userUsername, userAvatar, productId, productName, productImage, reviewDescription, rating, messageId} = reviewData
        const [result] = await pool.query(
            `INSERT INTO reviews (
                transaction_id, 
                payment_id, 
                user_id, 
                user_username,
                user_avatar,
                product_id, 
                product_name, 
                product_image, 
                review_description, 
                rating,
                message_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [transactionId, paymentId, userId, userUsername, userAvatar, productId, productName, productImage, reviewDescription, rating, messageId]
        )
        return {id: result.insertId, ...reviewData}
    } catch (error) {
        throw error
    }
}

/**
 * Get review by transaction ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<object|null>} Review data or null
 */
export async function getReviewByTransactionId(transactionId) {
    try {
        const [rows] = await pool.query("SELECT * FROM reviews WHERE transaction_id = ? LIMIT 1", [transactionId])
        return rows.length > 0 ? rows[0] : null
    } catch (error) {
        throw error
    }
}

/**
 * Get all reviews by user ID
 * @param {string} userId - Discord user ID
 * @returns {Promise<Array>} Array of reviews
 */
export async function getReviewsByUserId(userId) {
    try {
        const [rows] = await pool.query("SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC", [userId])
        return rows
    } catch (error) {
        throw error
    }
}

/**
 * Get all reviews for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} Array of reviews
 */
export async function getReviewsByProductId(productId) {
    try {
        const [rows] = await pool.query("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC", [productId])
        return rows
    } catch (error) {
        throw error
    }
}

/**
 * Get review statistics
 * @returns {Promise<object>} Statistics
 */
export async function getReviewStats() {
    try {
        const [totalRows] = await pool.query("SELECT COUNT(*) as total FROM reviews")
        const [avgRatingRows] = await pool.query("SELECT AVG(rating) as avgRating FROM reviews")
        const [ratingDistRows] = await pool.query(`SELECT rating, COUNT(*) as count FROM reviews GROUP BY rating ORDER BY rating DESC`)
        return {total: totalRows[0].total, averageRating: avgRatingRows[0].avgRating || 0, ratingDistribution: ratingDistRows}
    } catch (error) {
        throw error
    }
}

export async function closeDatabase() {
    if (pool) {
        await pool.end()
    }
}