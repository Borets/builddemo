"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
class Provider {
    static initialize(pool) {
        this.pool = pool;
    }
    static async find(conditions = {}) {
        try {
            let query = 'SELECT * FROM providers WHERE 1=1';
            const values = [];
            let paramIndex = 1;
            // Add conditions
            if (conditions.name) {
                query += ` AND name = $${paramIndex++}`;
                values.push(conditions.name);
            }
            const result = await this.pool.query(query, values);
            return result.rows.map(this.mapRowToProvider);
        }
        catch (error) {
            console.error('Error finding providers:', error);
            throw error;
        }
    }
    static async findById(id) {
        try {
            const result = await this.pool.query('SELECT * FROM providers WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToProvider(result.rows[0]);
        }
        catch (error) {
            console.error('Error finding provider by ID:', error);
            throw error;
        }
    }
    static async create(providerData) {
        try {
            const { name, description, apiKey, apiEndpoint, config } = providerData;
            const result = await this.pool.query(`INSERT INTO providers 
         (name, description, api_key, api_endpoint, config) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`, [name, description || null, apiKey || null, apiEndpoint || null, config ? JSON.stringify(config) : null]);
            return this.mapRowToProvider(result.rows[0]);
        }
        catch (error) {
            console.error('Error creating provider:', error);
            throw error;
        }
    }
    static async findByIdAndUpdate(id, updateData) {
        try {
            // First check if the provider exists
            const provider = await this.findById(id);
            if (!provider) {
                return null;
            }
            // Build the update query
            const updates = [];
            const values = [];
            let paramIndex = 1;
            if (updateData.name !== undefined) {
                updates.push(`name = $${paramIndex++}`);
                values.push(updateData.name);
            }
            if (updateData.description !== undefined) {
                updates.push(`description = $${paramIndex++}`);
                values.push(updateData.description);
            }
            if (updateData.apiKey !== undefined) {
                updates.push(`api_key = $${paramIndex++}`);
                values.push(updateData.apiKey);
            }
            if (updateData.apiEndpoint !== undefined) {
                updates.push(`api_endpoint = $${paramIndex++}`);
                values.push(updateData.apiEndpoint);
            }
            if (updateData.config !== undefined) {
                updates.push(`config = $${paramIndex++}`);
                values.push(JSON.stringify(updateData.config));
            }
            // Add the ID as the last parameter
            values.push(id);
            // Execute the update
            const result = await this.pool.query(`UPDATE providers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
            return this.mapRowToProvider(result.rows[0]);
        }
        catch (error) {
            console.error('Error updating provider:', error);
            throw error;
        }
    }
    static async deleteById(id) {
        try {
            const result = await this.pool.query('DELETE FROM providers WHERE id = $1 RETURNING id', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            console.error('Error deleting provider:', error);
            throw error;
        }
    }
    // Helper method to map database row to Provider interface
    static mapRowToProvider(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            apiKey: row.api_key,
            apiEndpoint: row.api_endpoint,
            config: row.config,
            createdAt: new Date(row.created_at)
        };
    }
}
exports.Provider = Provider;
