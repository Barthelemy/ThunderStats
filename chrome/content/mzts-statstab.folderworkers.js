"use strict";
Components.utils.import("chrome://thunderstats/content/mzts-utils.jsm");
Components.utils.import("resource://thunderstats/miczLogger.jsm");
Components.utils.import("resource:///modules/mailServices.js");

miczThunderStatsTab.folderworker={};

miczThunderStatsTab.folderworker.today_inboxmsg = {

  init: function(context) {
    this.context = context;
    this.inboxmsg = 0;
    this.inboxmsg_unread = 0;
    this.inbox0_msgdate = {};
    this.inbox0_msgdate_empty=true;
    this.msg_crunched=new Array();
    this.stale = true;
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] init done [inboxmsg: '+this.inboxmsg +'.\r\n');
  },

  uninit: function() {
    this._clear();
    delete this.inboxmsg;
    delete this.inboxmsg_unread;
    delete this.inbox0_msgdate;
    delete this.inbox0_msgdate_empty;
    delete this.msg_crunched;
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
    let headerValue = message.recipients.toLowerCase()+','+message.ccList.toLowerCase();
    let identity_addresses=this.context.identityAddresses.join(',');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] identity_addresses '+JSON.stringify(identity_addresses)+'\r\n');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] headerValue '+JSON.stringify(headerValue)+'\r\n');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] message.recipients '+JSON.stringify(message.recipients)+'\r\n');
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] ccList '+JSON.stringify(message.getStringProperty("ccList"))+'\r\n');

    let tmpAddresses = {};
    let tmpFullAddresses = {};
    MailServices.headerParser
                .parseHeadersWithArray(headerValue, tmpAddresses, {},
                                       tmpFullAddresses);
    addresses = tmpAddresses.value;
    fullAddresses = tmpFullAddresses.value;

	//message date
	let msg_date=moment.unix(message.dateInSeconds).format("YYYY-MM-DD");
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] message.dateInSeconds '+JSON.stringify(message.dateInSeconds)+'\r\n');
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] msg_date '+JSON.stringify(msg_date)+'\r\n');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] addresses '+JSON.stringify(addresses)+'\r\n');

    if (!deleted) {
      for (let i = 0; i < addresses.length; i++) {
		  if(identity_addresses.indexOf(addresses[i])>=0){
			  if(this.msg_crunched.indexOf(message.messageId)>-1)continue;
			  this.msg_crunched.push(message.messageId);
			  this.inboxmsg++;
			  if(!message.isRead){
				this.inboxmsg_unread++;
			  }
			  this.inbox0_msgdate_empty=false;
			  if(msg_date in this.inbox0_msgdate){
				this.inbox0_msgdate[msg_date]++;
			  }else{
				this.inbox0_msgdate[msg_date]=1;
			  }
			  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] this.inboxmsg '+this.inboxmsg+'\r\n');
			  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] headerValue '+JSON.stringify(headerValue)+'\r\n');
			  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] message.date '+JSON.stringify(message.date)+'\r\n');
			  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] message.messageId'+JSON.stringify(message.messageId)+'\r\n');
			  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] message.recipients '+JSON.stringify(message.recipients)+'\r\n');
		  }
      }
    }
  },

  render:function() {
	//inbox total messages
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] document.getElementById("today_inbox0_inboxmsg_wait") '+JSON.stringify(document.getElementById("today_inbox0_inboxmsg_wait"))+'\r\n');

	let _global_update=miczThunderStatsPrefs.getBoolPref_TS('global_update');

	miczThunderStatsTab.ui.update_inbox0_inboxmsg("today",this.inboxmsg,this.inboxmsg_unread);
	if(_global_update){
		miczThunderStatsTab.ui.update_inbox0_inboxmsg("yesterday",this.inboxmsg,this.inboxmsg_unread);
	}
	miczLogger.log("Inbox messages loaded.",0);

	//inbox date spread graph
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.folderworker.today_inboxmsg render (this.inbox0_msgdate) '+JSON.stringify(this.inbox0_msgdate)+'\r\n');
	if(!this.inbox0_msgdate_empty){
		let data_array=new Array();
		for (let key in this.inbox0_msgdate){
			data_array.push({"Date":key,"Num":this.inbox0_msgdate[key]});
		}
		//sort data
		data_array.sort(miczThunderStatsUtils.array_inbox0_date_compare);
		//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.folderworker.today_inboxmsg render (data_array) '+JSON.stringify(data_array)+'\r\n');
		$jQ("#today_inbox0_datemsg_nomails").hide();
		miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('today_inbox0_datemsg',data_array,true);	//the last parameter is to activate aggregation
		if(_global_update){
			$jQ("#yestarday_inbox0_datemsg_nomails").hide();
			miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('yesterday_inbox0_datemsg',data_array,true);	//the last parameter is to activate aggregation
		}
		//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.callback.stats_today_inbox0_datemsg handleCompletion '+JSON.stringify(this.data)+'\r\n');
	}else{
		miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('today_inbox0_datemsg',{},true);	//the last parameter is to activate aggregation
		$jQ("#today_inbox0_datemsg_nomails").show();
		if(_global_update){
			miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('yesterday_inbox0_datemsg',{},true);	//the last parameter is to activate aggregation
			$jQ("#yesterday_inbox0_datemsg_nomails").show();
		}
	}
	miczLogger.log("Date Inbox Mails data loaded.",0);

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

miczThunderStatsTab.folderworker.yesterday_inboxmsg = {

  init: function(context) {
    this.context = context;
    this.inboxmsg = 0;
    this.inboxmsg_unread = 0;
    this.inbox0_msgdate = {};
    this.inbox0_msgdate_empty=true;
    this.msg_crunched=new Array();
    this.stale = true;
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.yesterday_inboxmsg] init done [inboxmsg: '+this.inboxmsg +'.\r\n');
  },

  uninit: function() {
    this._clear();
    delete this.inboxmsg;
    delete this.inboxmsg_unread;
    delete this.inbox0_msgdate;
    delete this.inbox0_msgdate_empty;
    delete this.msg_crunched;
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
    let headerValue = message.recipients.toLowerCase()+','+message.ccList.toLowerCase();
    let identity_addresses=this.context.identityAddresses.join(',');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.yesterday_inboxmsg] identity_addresses '+JSON.stringify(identity_addresses)+'\r\n');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.yesterday_inboxmsg] headerValue '+JSON.stringify(headerValue)+'\r\n');

    let tmpAddresses = {};
    let tmpFullAddresses = {};
    MailServices.headerParser
                .parseHeadersWithArray(headerValue, tmpAddresses, {},
                                       tmpFullAddresses);
    addresses = tmpAddresses.value;
    fullAddresses = tmpFullAddresses.value;

    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.yesterday_inboxmsg] addresses '+JSON.stringify(addresses)+'\r\n');

    //message date
	let msg_date=moment.unix(message.dateInSeconds).format("YYYY-MM-DD");

    if (!deleted) {
      for (let i = 0; i < addresses.length; i++) {
		  if(identity_addresses.indexOf(addresses[i])>=0){
			  if(this.msg_crunched.indexOf(message.messageId)>-1)continue;
			  this.msg_crunched.push(message.messageId);
			  this.inboxmsg++;
			  if(!message.isRead){
				this.inboxmsg_unread++;
			  }
			  this.inbox0_msgdate_empty=false;
			  if(msg_date in this.inbox0_msgdate){
				this.inbox0_msgdate[msg_date]++;
			  }else{
				this.inbox0_msgdate[msg_date]=1;
			  }
			  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.yesterday_inboxmsg] this.inboxmsg '+this.inboxmsg+'\r\n');
		  }
      }
    }
  },

  render:function() {
	//inbox total messages
	miczThunderStatsTab.ui.update_inbox0_inboxmsg("yesterday",this.inboxmsg,this.inboxmsg_unread);
	miczLogger.log("Inbox messages loaded.",0);

	//inbox date spread graph
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.folderworker.yesterday_inboxmsg render (this.inbox0_msgdate) '+JSON.stringify(this.inbox0_msgdate)+'\r\n');
	if(!this.inbox0_msgdate_empty){
		let data_array=new Array();
		for (let key in this.inbox0_msgdate){
			data_array.push({"Date":key,"Num":this.inbox0_msgdate[key]});
		}
		//sort data
		data_array.sort(miczThunderStatsUtils.array_inbox0_date_compare);
		//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.folderworker.yesterday_inboxmsg render (data_array) '+JSON.stringify(data_array)+'\r\n');
		$jQ("#yesterday_inbox0_datemsg_nomails").hide();
		miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('yesterday_inbox0_datemsg',data_array,true);	//the last parameter is to activate aggregation
		//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.callback.stats_yesterday_inbox0_datemsg handleCompletion '+JSON.stringify(this.data)+'\r\n');
	}else{
		miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('yesterday_inbox0_datemsg',{},true);	//the last parameter is to activate aggregation
		$jQ("#yesterday_inbox0_datemsg_nomails").show();
	}
	miczLogger.log("Date Inbox Mails data loaded.",0);

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

miczThunderStatsTab.folderworker.folder_stats = {	//TODO
  init: function(context) {
    this.context = context;
    this.foldermsg = 0;
    this.foldermsg_unread = 0;
    this.folder_msgdate_sent = {};
    this.folder_msgdate_rcvd = {};
    this.folder_msgdate_empty=true;
    this.msg_crunched=new Array();
    this.stale = true;
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] init done [inboxmsg: '+this.inboxmsg +'.\r\n');
  },

  uninit: function() {
    this._clear();
    delete this.foldermsg;
    delete this.foldermsg_unread;
    delete this.folder_msgdate_sent;
    delete this.folder_msgdate_rcvd;
    delete this.folder_msgdate_empty;
    delete this.msg_crunched;
  },

  /**
   * Do some processing on a message in this folder.
   *
   * @param message the message to process
   * @param deleted true if the message was deleted, false otherwise
   */
  processMessage: function(message,deleted) {
    this.stale = true;

    let allAddresses;
    let fullAddresses;
    let authorsAddresses;
    let fullAuthorsAddresses;
    let recipientsAddresses;
    let fullRecipientsAddresses;

    let headerAuthor = message.mime2DecodedAuthor;
    let headerRecipients = message.recipients.toLowerCase()+','+message.ccList.toLowerCase();
    let headerValue= headerAuthor+','+headerRecipients;
    //let identity_addresses=this.context.identityAddresses.join(',');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] identity_addresses '+JSON.stringify(identity_addresses)+'\r\n');
    /*dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] headerAuthor '+JSON.stringify(headerAuthor)+'\r\n');
    dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] headerRecipients '+JSON.stringify(headerRecipients)+'\r\n');
    dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] headerValue '+JSON.stringify(headerValue)+'\r\n');
    dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] message.recipients '+JSON.stringify(message.recipients)+'\r\n');
	dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] ccList '+JSON.stringify(message.getStringProperty("ccList"))+'\r\n');
*/

	//message date
	let moment_msg_date=moment.unix(message.dateInSeconds);
	let msg_date=moment_msg_date.format("YYYY-MM-DD");
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] msg_date '+JSON.stringify(msg_date)+'\r\n');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] allAddresses '+JSON.stringify(allAddresses)+'\r\n');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] fullAddresses '+JSON.stringify(fullAddresses)+'\r\n');
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] msg_date from '+JSON.stringify(miczThunderStatsUtils._folderqry_from_date)+'\r\n');
	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] msg_date to '+JSON.stringify(miczThunderStatsUtils._folderqry_to_date)+'\r\n');

	//checking message date
	if(!((moment_msg_date.isSame(miczThunderStatsUtils._folderqry_from_date,'day'))||(moment_msg_date.isSame(miczThunderStatsUtils._folderqry_to_date,'day'))||(moment_msg_date.isAfter(miczThunderStatsUtils._folderqry_from_date,'day') && moment_msg_date.isBefore(miczThunderStatsUtils._folderqry_to_date,'day')))){
		//message date out of the considered interval
		return;
	}

    let tmpAddresses = {};
    let tmpFullAddresses = {};
    let tmpAuthors = {};
    let tmpFullAuthors = {};
    let tmpRecipients = {};
    let tmpFullRecipients = {};
	//all mails
    MailServices.headerParser.parseHeadersWithArray(headerValue,tmpAddresses,{},tmpFullAddresses);
    allAddresses = tmpAddresses.value;	//only mail for all
    fullAddresses = tmpFullAddresses.value;	//mail and name for all
    //authors mails
	MailServices.headerParser.parseHeadersWithArray(headerAuthor,tmpAuthors,{},tmpFullAuthors);
    authorsAddresses = tmpAuthors.value;	//only mail for authors
    fullAuthorsAddresses = tmpFullAuthors.value;	//mail and name for authors
    //recipients mails
	MailServices.headerParser.parseHeadersWithArray(headerRecipients,tmpRecipients,{},tmpFullRecipients);
    recipientsAddresses = tmpRecipients.value;	//only mail for recipeints
    fullRecipientsAddresses = tmpFullRecipients.value;	//mail and name for recipients

    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] authorsAddresses '+JSON.stringify(authorsAddresses)+'\r\n');
    //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] recipientsAddresses '+JSON.stringify(recipientsAddresses)+'\r\n');

    if (!deleted) {
	  if(miczThunderStatsUtils.arrayIntersectCheck(this.context.identityAddresses,allAddresses)){	//There is an identity we're considering
		  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] crunching... '+message.messageId+'\r\n');
		  //incrementing msg num
		  this.foldermsg++;
		  if(!message.isRead){
			 //incrementing unread msg num
			this.foldermsg_unread++;
		  }
		  this.folder_msgdate_empty=false;
		  //getting sent msg num per day
		  if(miczThunderStatsUtils.arrayIntersectCheck(this.context.identityAddresses,authorsAddresses)){
			  if(msg_date in this.folder_msgdate_sent){
				this.folder_msgdate_sent[msg_date]++;
			  }else{
				this.folder_msgdate_sent[msg_date]=1;
			  }
		  }
		  //getting rcvd msg num per day
		  if(miczThunderStatsUtils.arrayIntersectCheck(this.context.identityAddresses,recipientsAddresses)){
			  if(msg_date in this.folder_msgdate_rcvd){
				this.folder_msgdate_rcvd[msg_date]++;
			  }else{
				this.folder_msgdate_rcvd[msg_date]=1;
			  }
		  }

		  //getting top recipients -- TODO

		  //getting top senders -- TODO


		  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] this.foldermsg '+this.foldermsg+'\r\n');
		  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] message.date '+JSON.stringify(message.date)+'\r\n');
		  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] message.messageId'+JSON.stringify(message.messageId)+'\r\n');
		  //dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] message.recipients '+JSON.stringify(message.recipients)+'\r\n');
	  }
    }
  },

  render:function() {
	//miczThunderStatsTab.ui.update_folder_msgcount("today",this.foldermsg,this.foldermsg_unread);
	//TODO -- when considering the date as a filter get different layout per single day (premerge with trunk before)
	miczLogger.log("Folder messages loaded.",0);
	dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] rendering...\r\n');

	dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] this.foldermsg '+JSON.stringify(this.foldermsg)+'\r\n');
    dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] this.foldermsg_unread '+JSON.stringify(this.foldermsg_unread)+'\r\n');
    dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] this.folder_msgdate_sent '+JSON.stringify(this.folder_msgdate_sent)+'\r\n');
    dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.folder_stats] this.folder_msgdate_rcvd '+JSON.stringify(this.folder_msgdate_rcvd)+'\r\n');

	//dump('>>>>>>>>>>>>>> [miczThunderStatsTab.folderworker.today_inboxmsg] this.inboxmsg '+this.inboxmsg+'\r\n');

	//inbox date spread graph
	/*dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.folderworker.folder_stats render (this.inbox0_msgdate) '+JSON.stringify(this.folder_msgdate)+'\r\n');
	if(!this.folder_msgdate_empty){
		let data_array=new Array();
		for (let key in this.folder_msgdate){
			data_array.push({"Date":key,"Num":this.folder_msgdate[key]});
		}
		//sort data
		data_array.sort(miczThunderStatsUtils.array_folder_date_compare);
		dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.folderworker.folder_stats render (data_array) '+JSON.stringify(data_array)+'\r\n');
		$jQ("#today_folder_datemsg_nomails").hide();
		miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('today_folder_datemsg',data_array,true);	//the last parameter is to activate aggregation
		if(_global_update){
			$jQ("#yestarday_folder_datemsg_nomails").hide();
			miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('yesterday_folder_datemsg',data_array,true);	//the last parameter is to activate aggregation
		}
		dump('>>>>>>>>>>>>>> [miczThunderStatsTab] miczThunderStatsTab.callback.folder_stats handleCompletion '+JSON.stringify(this.data)+'\r\n');
	}else{
		miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('today_inbox0_datemsg',{},true);	//the last parameter is to activate aggregation
		$jQ("#today_inbox0_datemsg_nomails").show();
		if(_global_update){
			miczThunderStatsTab.ui.drawInbox0DateSpreadGraph('yesterday_inbox0_datemsg',{},true);	//the last parameter is to activate aggregation
			$jQ("#yesterday_inbox0_datemsg_nomails").show();
		}
	}*/

	miczLogger.log("Date Inbox Mails data loaded.",0);

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

}
