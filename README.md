# atom-discord
![Logo](https://i.imgur.com/3lXT3XJ.png)

[![David](https://img.shields.io/david/HelloWorld017/atom-discord.svg?style=flat-square)](https://david-dm.org/HelloWorld017/atom-discord)
[![license](https://img.shields.io/github/license/HelloWorld017/atom-discord.svg?style=flat-square)](https://github.com/HelloWorld017/atom-discord/blob/master/LICENSE)
[![apm version](https://img.shields.io/apm/v/atom-discord.svg?style=flat-square)](https://atom.io/packages/atom-discord)
[![apm downloads](https://img.shields.io/apm/dm/atom-discord.svg?style=flat-square)](https://atom.io/packages/atom-discord)
[![discord](https://img.shields.io/discord/405937562813726730.svg?logo=discord&style=flat-square&label=Discord&colorA=7289da&colorB=606060)](https://discord.gg/zfEs3K6)

Integrate your __atom__ with __Discord__ and show _Rich Presence_ information

## Installation
`$ apm install atom-discord` or `Atom Settings > Install > atom-discord`  
To see effect, please restart atom!

## Warning / Information
* You should add Atom to Discord game list to show rich presence.  
* When you are experiencing installation-related problem, try installing from source.

## FAQs
### It says that I need git!
You should need git to install this plugin. It is different with GitHub Client.  
You can get git from [here.](https://git-scm.com)

### It says that '$' is not recognized!
Please enter command to terminal without dollar sign.

### There is no apm command!
If you are using windows, you can find it at `(Atom Install Directory)\resources\app\apm\bin`.
Maybe your atom will be installed at `%appdata%/../Local/atom/`.

You can execute the command by changing 'apm' to whole path of apm.

### How can I install from source code?
```
$ git clone https://github.com/HelloWorld017/atom-discord.git
$ cd atom-discord
$ npm i
$ apm link
```

May the source be with you.

### Where can I get icons?
* You can get images from [fileicons-render](https://github.com/HelloWorld017/fileicons-render)  

## Changing the "Playing Atom Editor" text
For other texts, you can change it by editing i18n files.
But to change `Playing Atom Editor` text, you should create a new discord app.

Here are steps to do that.

1. **Create a new discord application.**  
Click [Here](https://discordapp.com/developers/applications/me) and create a new application.

2. **Set your app name and turn on rich presence.**  
![Set App Name](https://i.imgur.com/bsRGM77.png)
![Turn on Rich Presence](https://i.imgur.com/2iSR7Q3.png)

3. **Set Client ID to your application.**  
![Copy](https://i.imgur.com/vVw7XjC.png)  
Copy your Client ID at discord site.  
And replace DISCORD_ID in `(UserDirectory)/.atom/packages/atom-discord/src/send-discord.js` to your Client ID.  
![Replace](https://i.imgur.com/6mUbGWd.png)

4. **Upload image assets.**  
You can get icons from [HelloWorld017/fileicons-render](https://github.com/HelloWorld017/fileicons-render/tree/master/icons).  
Please download all icons and upload to rich presence assets.
![Uploading](https://i.imgur.com/Jqw3Jqu.png)  
You should upload all assets related to you.  
The asset name should be filename of the image and should be checked on `Large` Button.

5. **Upload small images**  
Also, you should upload small icons named `atom`.  
Get images you want and upload with name atom. It will be the small icon.

Then, you'll see changed text! :tada:  
Thanks to @DerpDays for explanation images.

## Screenshots
![Discord Integration](https://i.imgur.com/EMd4eZg.png)

![Atom settings](https://i.imgur.com/KHVrbw5.png)

![Custom project name](https://i.imgur.com/X90FfUP.png)
