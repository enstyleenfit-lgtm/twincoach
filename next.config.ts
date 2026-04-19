import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 本番で「どのコミットが画面に出ているか」をDOMから照合できるようにする（Vercel ビルド時のみ値が入る） */
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA:
      process.env.VERCEL_GIT_COMMIT_SHA ?? "",
  },
};

export default nextConfig;
