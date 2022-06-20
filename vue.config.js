const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.glb$/,
          type: 'asset/inline',
        },
        {
          test: /\.less$/,
          use: ['style-loader', 'css-loader', 'less-loader'],
        },
      ],
    },
  },
})
