import crypto from 'crypto';

export class CacheKeyGenerator {
  /**
   * Generates a deterministic SHA-256 hash for a given input.
   * Handles strings, objects, and arrays.
   */
  static generate(input: any, prefix: string = ''): string {
    const normalize = (data: any): string => {
      if (typeof data === 'string') return data;
      if (typeof data === 'number' || typeof data === 'boolean') return String(data);
      if (data === null || data === undefined) return '';
      
      // Sort object keys to ensure deterministic stringification
      if (Array.isArray(data)) {
        return JSON.stringify(data.map(item => normalize(item)));
      }
      
      if (typeof data === 'object') {
        const sortedKeys = Object.keys(data).sort();
        const sortedObj: Record<string, any> = {};
        for (const key of sortedKeys) {
          sortedObj[key] = data[key]; // Recursion not strictly needed for basic JSON but good for deep structures
        }
        return JSON.stringify(sortedObj);
      }
      
      return JSON.stringify(data);
    };

    const payload = normalize(input);
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    
    return prefix ? `${prefix}:${hash}` : hash;
  }
}
