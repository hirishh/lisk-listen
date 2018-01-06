## LiskListen - Lisk Transaction Visualizer ##

This software is a reworked version of [**BitListen.com**](http://bitlisten.com/).

Realtime Lisk transaction visualizer written in Nodejs/HTML/Javascript. See and hear new transactions and blocks as they propagate through the Lisk Network.

### Building ###

The project is built and ready-to-go. If you change any of the javascript, you will need to re-build the `lisklisten.min.js` file using Grunt. If you haven't used Grunt before, here is a short tutorial:

1. [Install Node.js](https://nodejs.org/download/).

2. Install grunt-cli using `sudo npm install -g grunt-cli`.

2. Cd into the project directory and run `npm install` to install the proper Grunt version and dependencies for this project.

3. Run `grunt` to build LiskListen. Alternatively, run `grunt watch` and watch for and rebuild changes in the source files.

4. Use another terminal to run `npm start` to start the software. It will be available at http://localhost:5425

The compiled/minified script will be output to `lisklisten.min.js`.

### Run with PM2 ###

Prerequisites: you've already built `lisklisten.min.js` by using `grunt` command.

Starting
<pre>
pm2 start app.json --watch
</pre>

Checking logs
<pre>
pm2 logs lisk-listen
</pre>

Stopping
<pre>
pm2 stop lisk-listen
</pre>

## Generating a startup script

Let pm2 detect available init system, generate configuration and enable startup system:

<pre>
pm2 startup
</pre>

Now follow the instruction. For example on ubuntu 14.04 LTE (with systemd as default init system) :

<pre>
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u [user] --hp /home/[user]
</pre>

Copy-paste the last command. Now, *if you didn't before*, run the application with ```pm2 start app.json --watch``` and then:
<pre>
pm2 save
</pre>

This last command will save the process list and execute them on reboot.

If you want to remove the init script, execute:
<pre>
pm2 unstartup [initsystem]
</pre>

For more information:  [Official PM2 Startup Script page](http://pm2.keymetrics.io/docs/usage/startup/#generating-a-startup-script)

### APIs and Libraries ###

LiskListen uses these libraries:

* [Howler.js](http://goldfirestudios.com/blog/104/howler.js-Modern-Web-Audio-Javascript-Library) by James Simpson

LiskListen uses these APIs:

* [Blockchain.info](https://blockchain.info/) WebSocket API (For BTC Transactions)
* [Bitstamp.net](https://www.bitstamp.net/) Web API (For Price Ticker USD/BTC)
* [Bittrex.com](https://bittrex.com/) Web API (For Price Ticker BTC/LSK)
* [Lisk Node](https://docs.lisk.io/docs) Web API (For Lisk Blocks and Transactions)

### License ###

If you distribute this project in part or in full, please attribute with a link to [the GitHub page](https://github.com/hirishh/lisk-listen). This software is available under the MIT License, details in the included `LICENSE.md` file.
