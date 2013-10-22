/* global importScripts, BackboneEvents, HTTP, payloads */
/* jshint unused:false */

var SPA = (function() {
  function SPA(options) {
    if (!options || !options.src)
      throw new Error("missing parameter: src");

    this.worker = new Worker(options.src);
    this.worker.onmessage = this._onMessage.bind(this);
    this.http = new HTTP();
  }

  SPA.prototype = {
    _onMessage: function(event) {
      var type;
      var topic = event.data.topic;
      var data = event.data.data;

      if (topic === "message") {
        type = data.shift();
        data = data.shift();
        this.trigger("message", type, data);
        this.trigger("message:" + type, data);
      } else if (topic === "offer") {
        this.trigger(topic, new payloads.Offer(data));
      } else if (topic === "answer") {
        this.trigger(topic, new payloads.Answer(data));
      } else if (topic === "hangup") {
        this.trigger(topic, data.peer);
      } else {
        this.trigger(topic, data);
      }
    },

    _send: function(topic, data) {
      // TODO: check the type of data and if it's a payload (like
      // payloads.Offer) call toJSON on it. The SPA interface should
      // not send custom objects.
      this.worker.postMessage({topic: topic, data: data});
    },

    signin: function(assertion, callback) {
      this.http.post("/signin", {assertion: assertion}, callback);
    },

    signout: function(nick, callback) {
      this.http.post("/signout", {nick: nick}, callback);
    },

    connect: function(credentials) {
      this._send("connect", credentials);
    },

    /**
     * Initiate a call via an SDP offer.
     *
     * @param {payloads.Offer} offerMsg an Offer payload to initiate a
     * call.
     */
    callOffer: function(offerMsg) {
      this._send("offer", offerMsg.toJSON());
    },

    /**
     * Accept a call via an SDP answer.
     *
     * @param {payloads.Answer} answerMsg an Answer payload to accept
     * a call.
     */
    callAnswer: function(answerMsg) {
      this._send("answer", answerMsg.toJSON());
    },

    callHangup: function(peer) {
      this._send("hangup", {peer: peer});
    },

    presenceRequest: function(nick) {
      this._send("presence:request", {nick: nick});
    }
  };

  BackboneEvents.mixin(SPA.prototype);

  return SPA;
}());
