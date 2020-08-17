# Adding Dex to your own domain

## By Iframes

SwitchDex has a wizard that loads the config on runtime, if you wanna add your domain using the configurations you used on the wizard, just use this
code snippet:

```html
<head>
    <style type="text/css">
        html {
            height: 100%;
        }
        body {
            margin: 0;
            height: 100%;
            overflow: hidden;
        }
    </style>
</head>

<body>
    <iframe
        allowtransparency="true"
        frameborder="0"
        id="rf"
        sandbox="allow-same-origin allow-forms allow-scripts"
        scrolling="auto"
        src="https://mcafeedex.com/#/erc20/?dex=whateverYourDexIDis"
        style="width:100%;height:100%"
    ></iframe>
</body>
```

## Hosting static files

Dex wizards loads on runtime the configs from backend, you can however pick up the static files from the dex at `site-build` folder, unpack it and serve using your own server. This gives you independency from Switch servers to serve assets, or you can even deploy it to ipfs, or maybe you want to change some default images or metas on index.html.

This is intended for advanced users that want control and freedom. The site-build was made running `yarn build` and `yarn pack` and adding trading view library that is private, you can however request from Trading View these same files and build from the source code, or disable trading view from your website.

Dex Wizard workflow: The wizard fetchs configuration from Switch backend and serve it statically, however the wizard check first if the same configuration exists localy on assets/wizard/ConfigFile.json (There is an example there already, rename it to ConfigFile.json or add your imported file to it), if not it downloads it and serve. You can download the config.json from the wizard and add it directly on the unpacked files on your server, this will improve slightly time loading, and you be fully independent.

Files that could be changed for full rebrand:

-   manifest.json
-   favicon.ico
-   index.html
-   favicons folder --> Replace with your own brand
-   assets/wizard/dex.png --> Image that shows when you share the dex on media - places like Twitter, Telegram or Facebook

## Future Improvements (On Progress)

At the moment all meta data is loaded from SwitchDex or McafeeDex depending of the domain, as improvement is planned add metadata at build time. You
download the build folder from SwitchDex, change configs and descriptions accordingly and then you will have a fully branded dex connected underhood to Switch Network.

At the moment SRA endpoints uses Switch server, a nice addition will be adding config for use directly decentralized public mesh node to be more resilient and censorship resistant. The only part of Switch dex that needs centralized servers are trading view endpoints, however the dex is prepared from the ground to disable this option and serve history data directly from blockchain events. At the moment, blockchain events are used to build these trading data points on backend.
