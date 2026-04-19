import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getDropletStatus } from './droplet.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Droplet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDropletStatus', () => {
    it('should return the droplet status', async () => {
      const mockResponse = {
        data: {
          droplet: {
            id: 123,
            status: 'active',
            // other fields...
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      process.env.DO_TOKEN = 'fake-token';

      const status = await getDropletStatus(123);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.digitalocean.com/v2/droplets/123',
        {
          headers: {
            Authorization: 'Bearer fake-token'
          }
        }
      );

      expect(status).toBe('active');
    });

    it('should throw error on API failure', async () => {
      const error = new Error('API Error');
      mockedAxios.get.mockRejectedValue(error);

      process.env.DO_TOKEN = 'fake-token';

      await expect(getDropletStatus(123)).rejects.toThrow('API Error');
    });
  });
});