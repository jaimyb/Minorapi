const mysql = require( 'mysql' );

class Database {
    constructor() {
        this.connection = mysql.createConnection( {
            host     : 'localhost',
            user     : 'root',
            database : 'minordb'
      } );
    }

    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            var query = this.connection.query( sql, args, ( err, rows ) => {
                console.log(args);
                if ( err )
                    return reject( err );
                resolve( rows );
            } );
            console.log(query.sql);
        } );
    }

    close() {
        return new Promise( ( resolve, reject ) => {
            this.connection.end( err => {
                if ( err )
                    return reject( err );
                resolve();
            } );
        } );
    }
}

module.exports = Database;