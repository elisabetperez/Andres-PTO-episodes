import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";

export default defineConfig({
  output: "server",
  adapter: netlify(),
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "src/assets/sass/framework/_vars/vars.scss";
            @import "src/assets/sass/framework/_mixins/mixins.scss";
          `,
        },
      },
    },
  },
});
