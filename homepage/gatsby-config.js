module.exports = {
  siteMetadata: {
    title: `Knowclip`,
    description: `Transform any video or audio file into effective language-learning materials. `,
    author: `@knowclip`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `knowclip`,
        short_name: `knowclip`,
        start_url: `/`,
        background_color: `#555555`,
        theme_color: `#555555`,
        display: `minimal-ui`,
        icon: `../src/icon.png`, // This path is relative to the root of the site.
      },
    },
    {
      resolve: "gatsby-plugin-web-font-loader",
      options: {
        google: {
          families: ["Roboto:300,400"],
        },
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
