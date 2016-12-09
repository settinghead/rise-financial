"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* exported config */
var config = {
  apiKey: "AIzaSyA8VXZwqhHx4qEtV5BcBNe41r7Ra0ZThfY",
  databaseURL: "https://fir-b3915.firebaseio.com"
};

var financialVersion = "1.0.0";
(function financial() {
  /* global Polymer, financialVersion, firebase, config */

  "use strict";

  var BQ_TABLE_NAME = "component_financial_events";

  var RiseFinancial = function () {
    function RiseFinancial() {
      _classCallCheck(this, RiseFinancial);
    }

    _createClass(RiseFinancial, [{
      key: "beforeRegister",
      value: function beforeRegister() {
        this.is = "rise-financial";

        this.properties = {
          /**
           * The optional usage type for Rise Vision logging purposes. Options are "standalone" or "widget"
           */
          usage: {
            type: String,
            value: ""
          },

          /**
           * ID of the financial list in Financial Selector.
           */
          financialList: {
            type: String,
            value: ""
          },

          /**
           * The list of instruments fields the component should return data for
           */
          instrumentFields: {
            type: Array,
            value: function value() {
              return [];
            }
          },

          /**
           * The id of the display running this instance of the component.
           */
          displayId: {
            type: String,
            readOnly: true,
            value: "preview"
          }

        };

        this._displayIdReceived = false;
        this._goPending = false;
      }
    }, {
      key: "_isValidUsage",
      value: function _isValidUsage(usage) {
        return usage === "standalone" || usage === "widget";
      }
    }, {
      key: "_onDisplayIdReceived",
      value: function _onDisplayIdReceived(displayId) {
        this._displayIdReceived = true;

        if (displayId && typeof displayId === "string") {
          this._setDisplayId(displayId);
        }

        if (this._goPending) {
          this._goPending = false;
          this.go();
        }
      }
    }, {
      key: "_getInstruments",
      value: function _getInstruments() {
        if (!this.financialList) {
          return;
        }

        this._instrumentsRef = firebase.database().ref("lists/" + this.financialList + "/instruments");
        this._instrumentsRef.on("value", this._handleInstruments);
      }
    }, {
      key: "_handleInstruments",
      value: function _handleInstruments(snapshot) {
        // TODO: Make request to financial server.
        console.log(snapshot.val()); // eslint-disable-line no-console
      }
    }, {
      key: "ready",
      value: function ready() {
        var _this = this;

        var params = {
          event: "ready"
        };

        if (!this._firebaseApp) {
          this._firebaseApp = firebase.initializeApp(config);
        }

        // listen for logger display id received
        this.$.logger.addEventListener("rise-logger-display-id", function (e) {
          _this._onDisplayIdReceived(e.detail);
        });

        // only include usage_type if it's a valid usage value
        if (this._isValidUsage(this.usage)) {
          params.usage_type = this.usage;
        }

        params.version = financialVersion;

        // log usage
        this.$.logger.log(BQ_TABLE_NAME, params);
      }
    }, {
      key: "attached",
      value: function attached() {
        this._getInstruments();
      }
    }, {
      key: "detached",
      value: function detached() {
        this._instrumentsRef.off("value", this._handleInstruments);
      }
    }, {
      key: "go",
      value: function go() {
        if (this._displayIdReceived) {
          // TODO
        } else {
          this._goPending = true;
        }
      }
    }]);

    return RiseFinancial;
  }();

  Polymer(RiseFinancial);
})();