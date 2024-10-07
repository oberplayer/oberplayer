
# Ober Player

Ober Player is the missing abstraction layer for a ready-to-use video player: a modern, clean UI on top of a Shaka player with the best possible front-end stack. Ober Player is SSR compatible.

[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![Tested in Next.js](https://img.shields.io/badge/Tested%20in-Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tested in Vite](https://img.shields.io/badge/Tested%20in-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[OberPlayer](https://www.oberplayer.com) is built with modern web technologies:

- **TypeScript:** Ensures type safety and enhances developer experience.
- **Preact:** A lightweight alternative to React for a fast and efficient UI.
- **Shaka Player:** A powerful and customizable media player library for handling streaming content.


## Key Features

- **Configurable color, text, and phrases:** Set the player as you need and in the language you want with only simple configuration options.
- **Playlist:** Let users binge-watch your series, suggest content at the end of the video, and increase your audience.
- **Easy integration in WordPress:** Integrate Ober Player with a simple shortcode and respect the WordPress code styling by using our WordPress plugin.
- **Clean documentation:** Comprehensive and well-organized documentation, making it easy to implement and troubleshoot.
- **Complete functions and events API:** Control the player, interact with your web app, and integrate reporting tools with our API.

[See more details and premium features here](https://www.oberplayer.com/features)

## Using Wordpress ? We've got a plugin for you

https://wordpress.org/plugins/ober-player/

## Why Ober Player Stands Out Against the Competition

| Feature	| Ober Player	| Other Known Players |
| ---| ------------- | ------------- |
| Design	| ✔️ Clean design that seamlessly integrates everywhere	| ❌ Developer-oriented design |
| Documentation	| ✔️ All resources available in one place	| ❌ Scattered across multiple web pages and GitHub repositories| 
| Mobile Optimization	| ✔️ UX optimized for an app-like experience	| ❌ No specific design for touch devices |

And some more good reason you can discover on the website.

## Installation

### Build your Ober Player from this repo

```bash
npm install && npm run build
```
and import (dist/esm) or require (dist/cjs) oberplayer.js.

You can also include oberplayer.js as a browser script by adding a script tag (dist/iife).

### As a package through NPM
```bash
npm install @oberplayer-free/oberplayer
```

### With our CDN (global script version)
```javascript
<script src="https://cdn.oberplayer.com/oberplayer.js"></script>
```

## Usage

```javascript
const player = await oberplayer(document.querySelector('#player_container')).setup({
  playlist: [
    {
      videoUrl: 'https://cdn.oberplayer.com/fixtures/mp4/bbb_27s_4k.mp4',
    },
  ],
});

player.api.play();
```
[See getting started section for more integration details ](https://www.oberplayer.com/docs/getting-started)

## API

For full API documentation, check out the [API Docs](https://www.oberplayer.com/docs/api).

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial (CC BY-NC)](./LICENSE) license.

