import { Pool } from 'pg';

export interface IProvider {
  id?: number;
  name: string;
  description?: string;
  apiKey?: string;
  apiEndpoint?: string;
  config?: Record<string, any>;
  createdAt?: Date;
}

export class Provider {
  private static pool: Pool;

  static initialize(pool: Pool) {
    this.pool = pool;
  }

  static async find(conditions: Partial<IProvider> = {}): Promise<IProvider[]> {
    try {
      let query = 'SELECT * FROM providers WHERE 1=1';
      const values: any[] = [];
      let paramIndex = 1;

      // Add conditions
      if (conditions.name) {
        query += ` AND name = $${paramIndex++}`;
        values.push(conditions.name);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(this.mapRowToProvider);
    } catch (error) {
      console.error('Error finding providers:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<IProvider | null> {
    try {
      const result = await this.pool.query('SELECT * FROM providers WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToProvider(result.rows[0]);
    } catch (error) {
      console.error('Error finding provider by ID:', error);
      throw error;
    }
  }

  static async create(providerData: IProvider): Promise<IProvider> {
    try {
      const { name, description, apiKey, apiEndpoint, config } = providerData;
      
      const result = await this.pool.query(
        `INSERT INTO providers 
         (name, description, api_key, api_endpoint, config) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [name, description || null, apiKey || null, apiEndpoint || null, config ? JSON.stringify(config) : null]
      );
      
      return this.mapRowToProvider(result.rows[0]);
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  static async findByIdAndUpdate(id: string, updateData: Partial<IProvider>): Promise<IProvider | null> {
    try {
      // First check if the provider exists
      const provider = await this.findById(id);
      
      if (!provider) {
        return null;
      }
      
      // Build the update query
      const updates: string[] = [];
      const values: any[] = [];
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
      const result = await this.pool.query(
        `UPDATE providers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      return this.mapRowToProvider(result.rows[0]);
    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  }

  static async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.pool.query('DELETE FROM providers WHERE id = $1 RETURNING id', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting provider:', error);
      throw error;
    }
  }

  // Helper method to map database row to Provider interface
  private static mapRowToProvider(row: any): IProvider {
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