import type { HttpClient } from "./http";
import type { SessionStore } from "./session";
import type { AppConfig } from "./config";
import type { StreamClient } from "./stream";

/**
 * The platform adapter every shared service factory receives. Each factory uses
 * only the slice it needs; the bundle keeps wiring at the call site to one
 * object. Web assembles this from axios + storage + Vite env; mobile will
 * assemble it from its own client + SecureStore + Expo env.
 */
export interface ServiceDeps {
  http: HttpClient;
  session: SessionStore;
  config: AppConfig;
  stream: StreamClient;
}
