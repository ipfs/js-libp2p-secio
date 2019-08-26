/**
 * @param {object} cipher
 * @param {function} mac
 */
declare function createBoxStream(cipher: any, mac: (...params: any[]) => any): void;

/**
 * @param {object} state
 * @param {function} callback
 */
declare function createUnboxStream(state: any, callback: (...params: any[]) => any): void;

/**
 * @param {object} state
 * @param {function} callback
 */
declare function ensureBuffer(state: any, callback: (...params: any[]) => any): void;

/**
 * @module handshake/crypto
 */
declare module "handshake/crypto" {
    /**
     * @param {object} state
     */
    function createProposal(state: any): void;
    /**
     * @param {object} state
     * @param {function} callback
     */
    function createExchange(state: any, callback: (...params: any[]) => any): void;
    /**
     * @param {object} state
     * @param {string} msg
     * @param {function} callback
     */
    function identify(state: any, msg: string, callback: (...params: any[]) => any): void;
    /**
     * @param {object} state
     * @param {function} callback
     */
    function selectProtocols(state: any, callback: (...params: any[]) => any): void;
    /**
     * @param {object} state
     * @param {string} msg
     * @param {function} callback
     */
    function verify(state: any, msg: string, callback: (...params: any[]) => any): void;
    /**
     * @param {object} state
     * @param {function} callback
     */
    function generateKeys(state: any, callback: (...params: any[]) => any): void;
    /**
     * @param {object} state
     * @param {string} n2
     */
    function verifyNonce(state: any, n2: string): void;
}

/**
 * @module handshake/exchange
 */
declare module "handshake/exchange" { }

/**
 * @module handshake/exchange
 */
declare module "handshake/exchange" { }

/**
 * @module handshake/finish
 */
declare module "handshake/finish" { }

/**
 * @module handshake/finish
 */
declare module "handshake/finish" { }

/**
 * @module handshake
 */
declare module "handshake" { }

/**
 * @module handshake
 */
declare module "handshake" { }

/**
 * @module handshake/propose
 */
declare module "handshake/propose" { }

/**
 * @module handshake/propose
 */
declare module "handshake/propose" { }

/**
 * @module handshake/secio
 * @type {string}
 */
declare module "handshake/secio" { }

/**
 * @module js-libp2p-secio
 */
declare module "js-libp2p-secio" {
    /**
     * @type {string}
     */
    var tag: string;
    /**
     * Encrypt
     * @param {*} localId
     * @param {*} conn
     * @param {*} remoteId
     * @param {*} callback
     */
    function encrypt(localId: any, conn: any, remoteId: any, callback: any): void;
}

/**
 *
 * @param {string} localId
 * @param {string} remoteId
 * @param {number} timeout
 * @param {function} callback
 */
declare class State {
    constructor(localId: string, remoteId: string, timeout: number, callback: (...params: any[]) => any);
    /**
     * Setup
     */
    setup(): void;
    /**
     * remove all data from the handshake that is not needed anymore
     */
    cleanSecrets(): void;
}

/**
 * @module support
 */
declare module "support" { }

/**
 * @exports support/exchanges
 */
declare module "support/exchanges" { }

/**
 * @exports support/ciphers
 */
declare module "support/ciphers" { }

/**
 * @exports support/hashes
 */
declare module "support/hashes" { }

/**
 *  @exports support/theBest
 * Determines which algorithm to use.  Note:  f(a, b) = f(b, a)
 * @param {number} order
 * @param {Array<*>} p1
 * @param {*} p2
 */
declare module "support/theBest" {
    /**
     * @param {object} target
     * @param {function} callback
     */
    function makeMacAndCipher(target: any, callback: (...params: any[]) => any): void;
    /**
     * @param {object} local
     * @param {object} remote
     * @param {function} cb
     */
    function selectBest(local: any, remote: any, cb: (...params: any[]) => any): void;
    /**
     * @param {Buffer} buf
     * @param {function} cb
     */
    function digest(buf: Buffer, cb: (...params: any[]) => any): void;
    /**
     * @param {object} state
     * @param {string} msg
     * @param {function} cb
     */
    function write(state: any, msg: string, cb: (...params: any[]) => any): void;
    /**
     * @param {*} reader
     * @param {function} cb
     */
    function read(reader: any, cb: (...params: any[]) => any): void;
}

