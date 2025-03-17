import { Pool, PoolClient, QueryResult } from 'pg';

export interface IBuild {
  id?: number;
  provider: string;
  buildTime: number;
  startTime: Date;
  endTime: Date;
  success: boolean;
  logs?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export class Build {
  private static pool: Pool;

  static initialize(pool: Pool) {
    this.pool = pool;
  }

  static async find(conditions: Partial<IBuild> = {}, sort: Record<string, 1 | -1> = { createdAt: -1 }, limit?: number): Promise<IBuild[]> {
    try {
      let query = 'SELECT * FROM builds WHERE 1=1';
      const values: any[] = [];
      let paramIndex = 1;

      // Add conditions
      if (conditions.provider) {
        query += ` AND provider = $${paramIndex++}`;
        values.push(conditions.provider);
      }
      
      if (conditions.success !== undefined) {
        query += ` AND success = $${paramIndex++}`;
        values.push(conditions.success);
      }

      // Add sorting
      const sortField = Object.keys(sort)[0] || 'created_at';
      const sortDirection = sort[sortField] === -1 ? 'DESC' : 'ASC';
      const dbSortField = this.convertToSnakeCase(sortField);
      query += ` ORDER BY ${dbSortField} ${sortDirection}`;

      // Add limit
      if (limit) {
        query += ` LIMIT $${paramIndex++}`;
        values.push(limit);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(this.mapRowToBuild);
    } catch (error) {
      console.error('Error finding builds:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<IBuild | null> {
    try {
      const result = await this.pool.query('SELECT * FROM builds WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToBuild(result.rows[0]);
    } catch (error) {
      console.error('Error finding build by ID:', error);
      throw error;
    }
  }

  static async create(buildData: IBuild): Promise<IBuild> {
    try {
      const { provider, buildTime, startTime, endTime, success, logs, metadata } = buildData;
      
      const result = await this.pool.query(
        `INSERT INTO builds 
         (provider, build_time, start_time, end_time, success, logs, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [provider, buildTime, startTime, endTime, success, logs || null, metadata ? JSON.stringify(metadata) : null]
      );
      
      return this.mapRowToBuild(result.rows[0]);
    } catch (error) {
      console.error('Error creating build:', error);
      throw error;
    }
  }

  static async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.pool.query('DELETE FROM builds WHERE id = $1 RETURNING id', [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting build:', error);
      throw error;
    }
  }

  static async aggregate(pipeline: any[]): Promise<any[]> {
    // Simplified aggregation for PostgreSQL
    // This is a basic implementation that handles the most common aggregation operations
    try {
      // For the comparison route, we need to group by provider and calculate stats
      const query = `
        SELECT 
          provider,
          AVG(build_time) as avg_build_time,
          MIN(build_time) as min_build_time,
          MAX(build_time) as max_build_time,
          COUNT(*) as total_builds,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_builds
        FROM builds
        GROUP BY provider
      `;
      
      const result = await this.pool.query(query);
      
      // Transform the result to match the expected format
      return result.rows.map(row => ({
        provider: row.provider,
        avgBuildTime: parseFloat(row.avg_build_time),
        minBuildTime: parseFloat(row.min_build_time),
        maxBuildTime: parseFloat(row.max_build_time),
        totalBuilds: parseInt(row.total_builds),
        successfulBuilds: parseInt(row.successful_builds),
        successRate: (parseInt(row.successful_builds) / parseInt(row.total_builds)) * 100
      }));
    } catch (error) {
      console.error('Error performing aggregation:', error);
      throw error;
    }
  }

  // Helper method to convert camelCase to snake_case
  private static convertToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Helper method to map database row to Build interface
  private static mapRowToBuild(row: Record<string, any>): IBuild {
    return {
      id: row.id,
      provider: row.provider,
      buildTime: parseFloat(row.build_time),
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      success: row.success,
      logs: row.logs,
      metadata: row.metadata,
      createdAt: new Date(row.created_at)
    };
  }
} 