"use strict";
const {classes: Cc, interfaces: Ci, utils: Cu, results : Cr} = Components;

let EXPORTED_SYMBOLS = ["miczLogger"];

var miczLogger = {
	logger:null,
	doc:null,
	
	setLogger:function(wrapper,document){
		this.logger=wrapper;
		this.doc=document;
	},
	
	output:function(msg){
		if(this.logger==null)return;

		let node = this.doc.createElement("p");
		let textnode = this.doc.createTextNode(msg);
		node.appendChild(textnode); 
		
		this.logger.appendChild(node);
	},
};