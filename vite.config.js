const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        about: './about.html',
        work: './work/index.html',
        factofly: './work/factofly.html'
      }
    }
  }
})
