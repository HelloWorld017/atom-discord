[![Discord](https://s33.postimg.cc/savzs5uhb/atom-banner.png)](http://discord.gg/8nG3FkS)

<p align="center">
  <b>Atom-Discord</b>
</p>

---

# FAQ

* [Custom Playing Status](#playing-status)
* [Install From Source](#install-from-source)
*

---

# Know Errors

* [There is no `APM` command](#apm)
*
*

 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---
 
 ---

# Playing Status
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

# Install From Source
It is fairly easy to install from the source code, here's how to do it!

Navigate to your atom packages directory usually found at (`(UserDirectory)/.atom/packages/`), then click `Git Bash Here`, then enter the following into the terminal:

```
git clone https://github.com/HelloWorld017/atom-discord.git
cd atom-discord
npm i
apm link
```

:tada: You installed atom-discord from the source

---

# APM
If you recieve the following error `idk the error` when installing atom-discord do the following

Find your Atom Install Directory usually located at (%appdata%/../Local/atom/YOUR-VERSION/resources/app/apm/bin/apm.cmd).and instead of running the apm command, link the full directory instead!

Example: `C:\Users\derpd\AppData\Local\atom\app-1.28.0\resources\app\apm\bin\apm.cmd install atom-discord`

You can execute the command by changing 'apm' to whole path of apm.
