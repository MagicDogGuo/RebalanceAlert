import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app';
import { openApiSpec } from '../../src/swagger/openapi';

describe('Swagger', () => {
  it('GET /api-docs.json 回傳 OpenAPI 規格', async () => {
    const response = await request(app).get('/api-docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe(openApiSpec.openapi);
    expect(response.body.paths['/health']).toBeDefined();
    expect(response.body.paths['/calculate-leverage']).toBeDefined();
  });

  it('GET /api-docs 回傳 Swagger UI', async () => {
    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });
});
