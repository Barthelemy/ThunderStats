"use strict";
Components.utils.import("chrome://thunderstats/content/dbutils/mzts-mdb.jsm");
//Components.utils.import("chrome://thunderstats/content/dbutils/mzts-storagedb.jsm");	 // To be enabled in vesion 2.0
Components.utils.import("chrome://thunderstats/content/dbutils/mzts-folderquery.jsm");
Components.utils.import("chrome://thunderstats/content/mzts-utils.jsm");

const {classes: Cc, interfaces: Ci, utils: Cu, results : Cr} = Components;

let EXPORTED_SYMBOLS = ["miczThunderStatsCore"];

var miczThunderStatsCore = {

	accounts:{},
	identities:{},
	_account_selector_prefix:'_account:',

	loadIdentities:function(){
			this.identities={};
			let acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
			let accounts = acctMgr.accounts;
			//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] accounts '+JSON.stringify(accounts)+'\r\n');
			for (let i = 0; i < accounts.length; i++) {
				let account = accounts.queryElementAt(i, Components.interfaces.nsIMsgAccount);
				if(account==null) continue;
				if((account.incomingServer.type!='pop3')&&(account.incomingServer.type!='imap')) continue;
				this.accounts[account.key]={};
				this.accounts[account.key].name=account.incomingServer.rootFolder.prettiestName;
				this.accounts[account.key].key=account.key;
				this.accounts[account.key].identities=new Array();
				//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] account.incomingServer '+JSON.stringify(account.incomingServer.type)+'\r\n');
				// Enumerate identities
				let identities=account.identities;
				for (let j = 0; j < identities.length; j++) {
					let identity = identities.queryElementAt(j, Components.interfaces.nsIMsgIdentity);
					//dump('>>>>>>>>>>>>>> [miczThunderStatsTab] identity '+JSON.stringify(identity)+'\r\n');
					if(!identity.email)continue;
					let identity_item={};
					identity_item["email"]=identity.email;
					identity_item["fullName"]=identity.fullName;
					identity_item["id"]=miczThunderStatsDB.queryGetIdentityID(identity.email);
					identity_item["key"]=identity.key;
					//identity_item["account_key"]=account.key;
					//identity_item["account_name"]=account.incomingServer.rootFolder.prettiestName;
					this.identities[miczThunderStatsDB.queryGetIdentityID(identity.email)]=identity_item;
					this.accounts[account.key].identities.push(miczThunderStatsDB.queryGetIdentityID(identity.email));
					dump('>>>>>>>>>>>>>> [miczThunderStatsTab] identity_item '+JSON.stringify(identity_item)+'\r\n');
				}
			}
			this.sortAccounts();
	},

	sortAccounts:function(){
		let accounts_order=miczThunderStatsUtils.getAccountsOrder();
		dump('>>>>>>>>>>>>>> [miczThunderStatsTab sortAccounts] accounts_order '+JSON.stringify(accounts_order)+'\r\n');
		let tmp_accounts={};
		for(let key in accounts_order){
			if(accounts_order[key] in this.accounts){
				tmp_accounts[accounts_order[key]]=this.accounts[accounts_order[key]];
			}
		}
		this.accounts=tmp_accounts;
	},

};

miczThunderStatsCore.db = {

	win:null,

	init:function(mWindow){
		this.win=mWindow;
	},

	getOneDayMessages:function(mType,mGivenDay,mIdentity,mCallback){	//mGivenDay is a Date object
		let mFromDate=new Date(mGivenDay);
		mFromDate.setHours(0,0,0,0);
		let mToDate=new Date(mGivenDay);
		mToDate.setHours(24,0,0,0);
		return miczThunderStatsDB.queryMessages(mType,mFromDate.getTime(),mToDate.getTime(),mIdentity,mCallback);
	},

	getManyDaysMessages:function(mType,mFromDay,mToDay,mIdentity,mCallback){	//mFromDay and mToDay are a Date objects
		let mDays = miczThunderStatsUtils.getDaysFromRange(mFromDay,mToDay);
		//dump('>>>>>>>>>>>>>> [miczThunderStatsTab getManyDaysMessages] mDays.length '+JSON.stringify(mDays.length)+'\r\n');
		for(let mKey in mDays){
			this.getOneDayMessages({type:mType,info:mDays[mKey]},mDays[mKey],mIdentity,mCallback);
		}
		return true;
	},

	getTodayMessages:function(mType,mIdentity,mCallback){
		return this.getOneDayMessages(mType,new Date(),mIdentity,mCallback);
	},

	getYesterdayMessages:function(mType,mIdentity,mCallback){
		let ydate = new Date();
		ydate.setDate(ydate.getDate() - 1);
		return this.getOneDayMessages(mType,ydate,mIdentity,mCallback);
	},

	getYesterdayIncrementalMessages:function(mType,mIdentity,mCallback){	//get the messages received yesterday until the actual hour
		let ydate = new Date();
		ydate.setDate(ydate.getDate() - 1);
		let mFromDate=new Date(ydate);
		mFromDate.setHours(0,0,0,0);
		return miczThunderStatsDB.queryMessages(mType,mFromDate.getTime(),ydate.getTime(),mIdentity,mCallback);
	},

	getOneDayInvolved:function(mType,mGivenDay,mIdentity,mCallback){	//mGivenDay is a Date object
		let mFromDate=new Date(mGivenDay);
		mFromDate.setHours(0,0,0,0);
		let mToDate=new Date(mGivenDay);
		mToDate.setHours(24,0,0,0);
		let mMax=10;
		return miczThunderStatsDB.queryGetNumInvolved(mType,mFromDate.getTime(),mToDate.getTime(),mIdentity,mMax,mCallback);
	},

	getTodayInvolved:function(mType,mIdentity,mCallback){
		return this.getOneDayInvolved(mType,new Date(),mIdentity,mCallback);
	},

	getYesterdayInvolved:function(mType,mIdentity,mCallback){
		let ydate = new Date();
		ydate.setDate(ydate.getDate() - 1);
		return this.getOneDayInvolved(mType,ydate,mIdentity,mCallback);
	},

	getManyDaysInvolved:function(mType,mFromDate,mToDate,mIdentity,mCallback){
		mFromDate.setHours(0,0,0,0);
		mToDate.setHours(24,0,0,0);
		let mMax=10;
		return miczThunderStatsDB.queryGetNumInvolved(mType,mFromDate.getTime(),mToDate.getTime(),mIdentity,mMax,mCallback);
	},

	getOneDayMessagesFolders:function(mType,mGivenDay,mIdentity,mCallback){
		let mFromDate=new Date(mGivenDay);
		mFromDate.setHours(0,0,0,0);
		let mToDate=new Date(mGivenDay);
		mToDate.setHours(24,0,0,0);
		return miczThunderStatsDB.queryMessagesFolders(mType,mFromDate.getTime(),mToDate.getTime(),mIdentity,mCallback);
	},

	getTodayMessagesFolders:function(mType,mIdentity,mCallback){
		return this.getOneDayMessagesFolders(mType,new Date(),mIdentity,mCallback);
	},

	getYesterdayMessagesFolders:function(mType,mIdentity,mCallback){
		let ydate = new Date();
		ydate.setDate(ydate.getDate() - 1);
		return this.getOneDayMessagesFolders(mType,ydate,mIdentity,mCallback);
	},

	getInboxMessagesTotal:function(mIdentity,mCallback){
		let mIdentityAddresses=miczThunderStatsUtils.getIdentitiesArray(mIdentity,miczThunderStatsCore.identities);
		dump(">>>>>>>>>>>>>> [miczThunderStatsTab getInboxMessagesTotal] mIdentity: " +JSON.stringify(mIdentity)+"\r\n");
		dump(">>>>>>>>>>>>>> [miczThunderStatsTab getInboxMessagesTotal] mIdentityAddress: " +JSON.stringify(mIdentityAddresses)+"\r\n");
		miczThunderStatsFolderQ.unregisterAnalyzer(mCallback);
		miczThunderStatsFolderQ.init(miczThunderStatsDB.queryGetInboxFolders(),mIdentityAddresses,this.win);
		miczThunderStatsFolderQ.registerAnalyzer(mCallback);
		miczThunderStatsFolderQ.run();
		//miczThunderStatsFolderQ.unregisterAnalyzer(mCallback);
	},

	/*getInboxMessagesDate:function(mIdentity,mCallback){
		//miczThunderStatsDB.queryInboxMessagesDate(mIdentity,mCallback);
	},*/

	getResultObject:function(aFields,aResultSet){
		let oOutput={};
		let r_idx=1;
		for (let row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {
			oOutput[r_idx]={};
			for (let colidx in aFields){
				//miczLogger.log("Test CALLBACK: col "+colidx+" "+JSON.stringify(row.getResultByIndex(colidx)));
				oOutput[r_idx][aFields[colidx]]=row.getResultByName(aFields[colidx]);
			}
			r_idx++;
		}
		dump(">>>>>>>>>>>>>> [miczThunderStatsTab] getResultObject: " +JSON.stringify(oOutput)+"\r\n");
		return oOutput;
	},
};
