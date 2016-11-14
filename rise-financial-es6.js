( function financial() {
  /* global Polymer, financialVersion */

  "use strict";

  var BQ_TABLE_NAME = "component_financial_events";

  class RiseFinancial {

    beforeRegister() {
      this.is = "rise-financial";

      this.propertiees = {
        /**
         * The optional usage type for Rise Vision logging purposes. Options are "standalone" or "widget"
         */
        usage: {
          type: String,
          value: ""
        }
      };
    }

    _isValidUsage( usage ) {
      return usage === "standalone" || usage === "widget";
    }

    ready() {
      let params = {
        event: "ready"
      };

      // only include usage_type if it's a valid usage value
      if ( this._isValidUsage( this.usage ) ) {
        params.usage_type = this.usage;
      }

      params.version = financialVersion;

      // log usage
      this.$.logger.log( BQ_TABLE_NAME, params );
    }

  }

  Polymer( RiseFinancial );

} )();
