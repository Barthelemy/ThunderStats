"use strict";
Components.utils.import("chrome://thunderstats/content/mzts-utils.jsm");
Components.utils.import("resource://thunderstats/miczLogger.jsm");
Components.utils.import("resource:///modules/mailServices.js");

miczThunderStatsTab.folderworker={};

miczThunderStatsTab.folderworker.today_inboxmsg = {

  init: function(context) {
    this.context = context;
    this.inboxmsg = 0;
    this.stale = true;
	dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] init done [inboxmsg: '+this.inboxmsg +'.\r\n');
  },

  uninit: function() {
    this._clear();
    delete this.inboxmsg;
  },

  /**
   * Do some processing on a message in this folder.
   *
   * @param message the message to process
   * @param deleted true if the message was deleted, false otherwise
   */
  processMessage: function(message,deleted) {
    this.stale = true;

    let addresses;
    let fullAddresses;

    //let headerValue = message.mime2DecodedAuthor;
    let headerValue = message.mime2DecodedRecipients.toLowerCase();
    let identity_addresses=this.context.identityAddresses.join(',');
    dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] identity_addresses '+JSON.stringify(identity_addresses)+'\r\n');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] headerValue '+JSON.stringify(headerValue)+'\r\n');

    let tmpAddresses = {};
    let tmpFullAddresses = {};
    MailServices.headerParser
                .parseHeadersWithArray(headerValue, tmpAddresses, {},
                                       tmpFullAddresses);
    addresses = tmpAddresses.value;
    fullAddresses = tmpFullAddresses.value;

    dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] addresses '+JSON.stringify(addresses)+'\r\n');

    if (!deleted) {
      for (let i = 0; i < addresses.length; i++) {
		  if(identity_addresses.indexOf(addresses[i])>=0){
			  this.inboxmsg++;
			  dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] this.inboxmsg '+this.inboxmsg+'\r\n');
		  }
      }
    }
  },

  render:function() {
	miczThunderStatsTab.ui.hideLoadingElement("today_inbox0_inboxmsg_wait");
	$jQ("#today_inbox0_inboxmsg").text(this.inboxmsg);
	miczLogger.log("Inbox messages loaded.",0);
    this.stale = false;
  },

  update: function() {
    if (this.stale) {
      this._clear();
      this.render();
    }
  },

  _clear: function() {
	  //
  },

};