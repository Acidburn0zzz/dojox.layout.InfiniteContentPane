dojo.require("dojo.parser");
dojo.require("dijit.layout.ContentPane");
dojo.experimental("dojox.layout.InfiniteContentPane");

dojo.provide("dojox.layout.InfiniteContentPane");

dojo.declare("dojox.layout.InfiniteContentPane",
		[dijit.layout.ContentPane],
{
	fetcher: null, // dojo.Deferred given us for returning the next content
	triggerHeight: 100, // hot zone that triggers a fetch needs to be fixed height, percentages would make it funky as more content gets loaded it would get too big
	fetchCount: 0, // Iterator showing how many times we've expanded. Might be useful to return to our fetcher

	_paneHeight: 0, // this is private because it can't be set externally, it's just the size we read ourselves to be
	_scrollHeight: 0,
	_connect: null, // a handle for our on scroll event so we can shut it off the workings if we run out of data

	postCreate: function () {
		this._connect = this.connect(this.domNode, "onscroll", "_onScroll");

		this._calc();

		// TODO: Connect an onresize function to our parent pane to _calc and _onScroll

		return this.inherited(arguments);
	},

	_calc: function () {
		// TODO: do some match to make sure trigger zone is a reasonable size of pane?
		this._paneHeight = dojo._getMarginSize(this.domNode).h;
		this._scrollHeight = this.domNode['scrollHeight'];
	},

	_onScroll: function (/* Event */e) {
		// Find our current position
		var bottomPos = this.domNode['scrollTop'] + this._paneHeight;

		// Do the math to see if the trigger zone area has scrolled into view
		if (bottomPos > (this._scrollHeight - this.triggerHeight)) {
			// If so tell tigger our fetch method to go get more data
			this._fetch();
		}

		// TODO: set timeout so we don't fire fetch to often.?
		// TODO: Maybe count if we have an outstanding deferred?
		// TODO: disconnect scroll notifier until we get previous data?
	},

	_fetch: function () {
		this.fetchCount += 1;

		// Start a placeholder for content that we'll be fetching.
		// Doing this now let's us set a loading message and keeps
		// content in order as it comes back.
		var wrapper = dojo.create("div", {class: 'dojoxInfiniteContentPane', innerHTML: 'Loading...'});
		dojo.place(wrapper, this.domNode, 'last');

		// Start up a deferred objet to handle data when it comes
		// back from our fetcher
		var deferred = new dojo.Deferred();
		deferred.then(dojo.hitch(this, function(data) {
			// If we get nothing back, presume we've reached the end of the possible data
			if (!data.length) {
				return this._disable();
			}

			wrapper.innerHTML = data;

			if (this.parseOnLoad) {
				dojo.parser.parse(wrapper);
			}

			// Update our knowledge about ourselves now that we stuffed new data
			this._calc();
			
			// TODO: reactivate scroll watcher if suspended above
		}));

		// Wire up the the deferred handle we just made to a new instance
		// of the fetcher we were given. The value should indicate whether
		// there is a possibility of more data or not.
		var ret = this.fetcher(dojo.hitch(this, deferred.callback), this.fetchCount);
		if (ret === false) {
			return this._disable();
		}
	},

	_disable: function() {
		// If we stop getting data, unwire the scroll event to save resources
		dojo.disconnect(this._connect[0]);
	}

});
