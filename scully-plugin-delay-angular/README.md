# scully-plugin-delay-angular

This `postRenderer` plugin for [Scully](http://scully.io/) removes the static assets that bootstrap the Angular application.

If you are only using Angular to build a static / informational website with little extra functionality 
it could be overkill to still use Angular on the frontend.
 
Disabling Angular on the frontend will speed up your loading times and mobile scores even more!

## Installation

To install this library with `npm` run

```
$ npm install scully-plugin-delay-angular --save-dev
```
or with `yarn`
```
$ yarn add scully-plugin-delay-angular
```

## Usage

Import and add the plugin to the `defaultPostRenderers` to execute it on all rendered pages 
or use the `postRenderers` on a route configuration to execute it for a specific route:

```js
const {RouteTypes} = require('@scullyio/scully');
const {delayAngular} = require('scully-plugin-delay-angular');

const postRenderers = [delayAngular];

exports.config = {
  projectRoot: './src/app',
  defaultPostRenderers: postRenderers,  // for all routes
  routes: {
    '/blog/:slug': {
      type: RouteTypes.contentFolder,
      slug: {
        folder: "./blog"
      },
      postRenderers: postRenderers      // per route config
    },
  }
};
```

Now build your app with the `--stats-json` flag enabled as the plugin needs to know which assets 
have been build for your app. Then just run the Scully command.

```shell script
npm run build -- --prod --stats-json
npm run scully
```

## More information

I've written a [blogpost about custom plugins for Scully](https://samvloeberghs.be/posts/custom-plugins-for-scully-angular-static-site-generator).
Check it out to learn more on how to build your own custom plugins.

More info on getting started with [Scully](http://scully.io/) can be found on [their homepage](http://scully.io/).
