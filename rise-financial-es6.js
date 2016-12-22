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
         * Interval for which data should be retrieved.
         * Valid values are: Day, Week, 1M, 3M, 6M, 1Y, 5Y.
         */
        duration: {
          type: String,
          value: "1M"
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

    /***************************************** HELPERS ********************************************/

    _isValidType( type ) {
      return type === "real-time" || type === "historical";
    }

    _isValidUsage( usage ) {
      return usage === "standalone" || usage === "widget";
    }

    _isValidDuration( duration, type ) {
      if ( type.toLowerCase() === "historical" ) {
        // Parameters passed to financial server are case sensitive.
        return [ "Day", "Week", "1M", "3M", "6M", "1Y", "5Y" ].indexOf( duration ) !== -1;
      } else {
        return true;
      }
    }

    _startTimer() {
      this.debounce( "refresh", () => {
        this.$.financial.generateRequest();
      }, 60000 );
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
      this._saveInstruments( this._instruments );
      this._instrumentsReceived = true;
      this.go();
    }

    _saveInstruments( instruments ) {
      try {
        localStorage.setItem( `risefinancial_${ this.financialList }`, JSON.stringify( instruments ) );
      } catch ( e ) {
        console.warn( e.message );
      }
    }

    /***************************************** FINANCIAL ******************************************/

    _getParams( instruments, fields ) {
      return Object.assign( {},
        {
          id: this.displayId,
          code: this._getSymbols( instruments ),
          tqx: "out:json;responseHandler:callback",
        },
        fields.length > 0 ? { tq: this._getQueryString( fields ) } : null );
    }

    _getQueryString( fields ) {
      if ( fields.length === 0 ) {
        return "";
      }

      return `select ${ fields.join( "," ) }`;
    }

    _getData( props, instruments, fields ) {
      if ( !this._isValidType( props.type ) || !this._isValidDuration( props.duration, props.type ) ) {
        return;
      }

      const financial = this.$.financial,
        params = this._getParams( instruments, fields );

      if ( props.type === "real-time" ) {
        financial.url = config.financial.realTimeURL;
      } else {
        params.kind = props.duration;
        financial.url = config.financial.historicalURL;
      }

      financial.params = params;
    }

    _handleData( e, resp ) {
      const response = {
        instruments: this._instruments,
      };

      if ( resp && resp.table ) {
        response.data = resp.table;
      }

      this.fire( "rise-financial-response", response );
      this._startTimer();
    }

    _handleError( e, resp ) {
      this.fire( "rise-financial-error", resp );
      this._startTimer();
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

      this._getData(
        {
          type: this.type,
          duration: this.duration,
        },
        this._instruments,
        this.instrumentFields
      );
    }
  }

  Polymer( RiseFinancial );

} )();
