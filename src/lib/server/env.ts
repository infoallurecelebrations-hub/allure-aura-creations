import "server-only";

export type AdminEnvironment = {
  adminEmail: string;
  adminPasswordHash: string;
  sessionSecret: string;
  githubOwner: string;
  githubRepository: string;
  githubBranch: string;
  githubToken: string;
};

export function getAdminEnvironment(): AdminEnvironment {
  const environment = {
    adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "",
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH?.trim() ?? "",
    sessionSecret: process.env.SESSION_SECRET?.trim() ?? "",
    githubOwner: process.env.GITHUB_OWNER?.trim() || "infoallurecelebrations-hub",
    githubRepository: process.env.GITHUB_REPOSITORY?.trim() || "allure-aura-creations",
    githubBranch: process.env.GITHUB_BRANCH?.trim() || "main",
    githubToken: process.env.GITHUB_CONTENT_TOKEN?.trim() ?? "",
  };

  const missing = [
    ["ADMIN_EMAIL", environment.adminEmail],
    ["ADMIN_PASSWORD_HASH", environment.adminPasswordHash],
    ["SESSION_SECRET", environment.sessionSecret],
    ["GITHUB_CONTENT_TOKEN", environment.githubToken],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    throw new Error(`Admin environment is not configured: ${missing.join(", ")}`);
  }
  if (environment.sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return environment;
}
