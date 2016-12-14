( function financial() {
  /* global Polymer, financialVersion, firebase, config */

  "use strict";

  var BQ_TABLE_NAME = "component_financial_events";

  class RiseFinancial {

    beforeRegister() {
      this.is = "rise-financial";

      /**
       * Fired when a response is received.
       *
       * @event rise-financial-response
       */

       /**
       * Fired when an error is received.
       *
       * @event rise-financial-error
       */

      this.properties = {
        /**
         * Type of data to fetch, either "real-time" or "historical".
         */
        type: {
          type: String,
          value: "real-time"
        },

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
          value: () => {
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
      this._instrumentsReceived = false;
      this._goPending = false;
      this._instruments = {};
    }

    _isValidType( type ) {
      return type === "real-time" || type === "historical";
    }

    _isValidUsage( usage ) {
      return usage === "standalone" || usage === "widget";
    }

    _onDisplayIdReceived( displayId ) {
      this._displayIdReceived = true;

      if ( displayId && typeof displayId === "string" ) {
        this._setDisplayId( displayId );
      }

      this.go();
    }

    /***************************************** FIREBASE *******************************************/

    _getInstruments() {
      if ( !this.financialList ) {
        return;
      }

      this._instrumentsRef = firebase.database().ref( `lists/${ this.financialList }/instruments` );
      this._handleInstruments = this._handleInstruments.bind( this );
      this._instrumentsRef.on( "value", this._handleInstruments );
    }

    _handleInstruments( snapshot ) {
      const instruments = snapshot.val();

      this._instruments = instruments ? instruments : {};
      this._instrumentsReceived = true;
      this.go();
    }

    /***************************************** REAL-TIME ******************************************/

    _getRealTimeParams( instruments, fields = [] ) {
      return Object.assign( {},
        {
          id: this.displayId,
          code: this._getSymbols( instruments ),
          tqx: "out:json;responseHandler:callback",
        },
        fields.length > 0 ? { tq: this._getRealTimeQueryString( fields ) } : null );
    }

    _getRealTimeQueryString( fields = [] ) {
      if ( fields.length === 0 ) {
        return "";
      }

      return `select ${ fields.join( "," ) }`;
    }

    _getRealTimeData( instruments, fields = [] ) {
      const realTime = this.$.realTime;

      realTime.url = config.financial.realTimeURL;
      realTime.params = this._getRealTimeParams( instruments, fields );
    }

    _handleRealTimeData( e, resp ) {
      const response = {
        instruments: this._instruments,
      };

      if ( resp && resp.table ) {
        response.data = resp.table;
      }

      this.fire( "rise-financial-response", response );
    }

    _handleRealTimeError( e, resp ) {
      this.fire( "rise-financial-error", resp );
    }

    _getSymbols( instruments ) {
      const symbols = Object.keys( instruments ).map( ( key ) => {
        return instruments[ key ].symbol;
      } );

      return symbols.join( "|" );
    }

    ready() {
      let params = {
        event: "ready"
      };

      if ( !this._firebaseApp ) {
        this._firebaseApp = firebase.initializeApp( config.firebase );
      }

      // listen for logger display id received
      this.$.logger.addEventListener( "rise-logger-display-id", ( e ) => {
        this._onDisplayIdReceived( e.detail );
      } );

      // only include usage_type if it's a valid usage value
      if ( this._isValidUsage( this.usage ) ) {
        params.usage_type = this.usage;
      }

      params.version = financialVersion;

      // log usage
      this.$.logger.log( BQ_TABLE_NAME, params );
    }

    attached() {
      this._getInstruments();
    }

    detached() {
      this._instrumentsRef.off( "value", this._handleInstruments );
    }

    go() {
      if ( !this._displayIdReceived || !this._instrumentsReceived ) {
        this._goPending = true;
        return;
      }

      this._goPending = false;

      if ( !this._isValidType( this.type ) ) {
        return;
      }

      if ( this.type === "real-time" ) {
        this._getRealTimeData( this._instruments, this.instrumentFields );
      }
    }
  }

  Polymer( RiseFinancial );

} )();
