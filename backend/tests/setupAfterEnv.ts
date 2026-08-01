import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Environment variables must be set before any module (e.g. src/config/env.ts) is imported,
// since that module validates and freezes process.env values at import time.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_test_jwt_secret_32c";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_test_refresh_secret";
process.env.CLIENT_URL = "http://localhost:3000";
// Placeholder to satisfy env schema validation at module-import time — the real connection
// below uses the in-memory server's URI directly via mongoose.connect(), not this value.
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/ecoalert-test-placeholder";

// These tests spin up a real, in-memory MongoDB instance via mongodb-memory-server.
// The first run downloads a mongod binary (cached afterward in ~/.cache/mongodb-binaries) —
// this requires outbound internet access to https://fastdl.mongodb.org. In network-restricted
// CI or sandboxed environments without that access, either pre-seed the binary cache or point
// MONGOMS_SYSTEM_BINARY at a mongod already installed on the box.

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  // Report category is now validated against the live Category collection rather than a
  // fixed enum (see docs/ARCHITECTURE.md) — seed the defaults before every test so tests
  // that create reports with e.g. category: "illegal_dumping" keep working unchanged.
  const { ensureDefaultCategories } = await import("../src/services/category.service");
  await ensureDefaultCategories();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});
