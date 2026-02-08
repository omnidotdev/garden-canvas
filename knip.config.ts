import type { KnipConfig } from "knip";

/**
 * Knip configuration.
 * @see https://knip.dev/overview/configuration
 */
const knipConfig: KnipConfig = {
  entry: ["src/lib/garden.css"],
  project: ["src/**/*.{ts,tsx,css}"],
  ignore: ["src/generated/**"],
  ignoreExportsUsedInFile: true,
};

export default knipConfig;
