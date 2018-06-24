[![Discord](https://s33.postimg.cc/savzs5uhb/atom-banner.png)](http://discord.gg/zfEs3K6)

<p align="center">
  <b><a href="https://github.com/HelloWorld017/atom-discord">Atom-Discord</a></b> / <a href="https://github.com/HelloWorld017/atom-discord/blob/master/faq.md">FAQ</a>
</p>

---

# FAQ

* [Custom Playing Status](#playing-status)  
* [Getting File Icons](#getting-file-icons)

---

# Known Errors

* [There is no `apm` or `npm` command](#apm-npm-is-not-recognized)
* [Doesn't show rich pressence](#not-showing)


----

# Playing Status
## Changable Text
To change other texts like 'Editing a (name) file', follow this steps:

1. **Open i18n file**
Open file located in `(UserDirectory)/.atom/packages/atom-discord/i18n/(Currently Using Language).json`

2. **Change desired text**
Change content of the json file in order to change your desired text.

## "Playing Atom Editor" Text
To change the "Playing Atom Editor" text you will need to make a new [discord developer application](https://discordapp.com/developers/applications/me/create), you can do this by repeating the following steps:


1. **Create a new discord developer application.**  
Click [Here](https://discordapp.com/developers/applications/me) and create a new application.

2. **Set your app name and turn on rich presence.**  
![Set App Name](https://i.imgur.com/2iSR7Q3.png)
![Turn on Rich Presence](https://i.imgur.com/GydIB7q.png)
> Make sure to click `Create App` first or you won't see the `Enable Rich Presence` button! 

3. **Set Client ID to your application.**   
Copy your `Client ID` (found here)
![Copy](https://i.imgur.com/vVw7XjC.png) 
And replace `DISCORD_ID` in `(UserDirectory)/.atom/packages/atom-discord/src/send-discord.js` to your `Client ID`.  
![Replace](https://i.imgur.com/6mUbGWd.png)

> Now your playing status will have changed, but the icon's wont work unless you do the following.

4. **Upload large assets.**   
Download all of the programming languages icons ([available here](https://github.com/HelloWorld017/fileicons-render/tree/master/icons)) and upload them all as large assets (if you miss one it won't work!). The asset name should be filename of the image (without the `.png`!) and the size should be on Large or it wont work!
Example:
![Uploading](https://i.imgur.com/Jqw3Jqu.png)   

5. **Upload small assets.**  
Now you can upload the small assets, you can choose not to do this however it is up to you!
If you choose to upload them you will need to upload a small asset for all 5 types of the logo.

![SmallAsset](https://i.imgur.com/iOToNbC.png)

Names:
* atom-original
* atom
* atom-2
* atom-3
* atom-5

> :tada: There, your done! Now you have a custom playing status, congratulations!

---

# Getting File Icons
* You can get images from [fileicons-render](https://github.com/HelloWorld017/fileicons-render)  

---

# apm, npm is not recognized
If you recieve the following error when installing atom-discord do the following:
```
'apm (or npm)' is not recognized as an internal or external command,
operable program or batch file.
```

Find your Atom Install Directory usually located at (`%appdata%/../Local/atom/YOUR-VERSION/resources/app/apm/bin/apm.cmd`).and instead of running the apm command, link the full directory instead!

Example:
```
  C:\Users\USERNAME\AppData\Local\atom\app-1.28.0\resources\app\apm\bin\apm.cmd install atom-discord
  C:\Users\USERNAME\AppData\Local\atom\app-1.28.0\resources\app\apm\bin\npm.cmd install
```

You can execute the command by changing 'apm' to whole path of apm.cmd, 'npm' to path of npm.cmd

---

# Not Showing
If you rich presence isn't showing in discord, make sure you have got Atom-Editor added as a program, and if that doesnt work try [installing from the source code](#installing-from-source), and if that doesn't work ask for help in our support server!
