"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var financialVersion = "1.0.0";
(function financial() {
  /* global Polymer, financialVersion */

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
           * The list of instruments fields the component should return data for
           */
          instrumentFields: {
            type: Array,
            value: function value() {
              return [];
            }
          }
        };
      }
    }, {
      key: "_isValidUsage",
      value: function _isValidUsage(usage) {
        return usage === "standalone" || usage === "widget";
      }
    }, {
      key: "ready",
      value: function ready() {
        var params = {
          event: "ready"
        };

        // only include usage_type if it's a valid usage value
        if (this._isValidUsage(this.usage)) {
          params.usage_type = this.usage;
        }

        params.version = financialVersion;

        // log usage
        this.$.logger.log(BQ_TABLE_NAME, params);
      }
    }]);

    return RiseFinancial;
  }();

  Polymer(RiseFinancial);
})();