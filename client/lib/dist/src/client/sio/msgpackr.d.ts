export declare const protocol = 5;
/**
 * Packet types (see https://github.com/socketio/socket.io-protocol)
 */
export declare const PacketType: {
    CONNECT: number;
    DISCONNECT: number;
    EVENT: number;
    ACK: number;
    CONNECT_ERROR: number;
};
export declare function Encoder(): void;
export declare function Decoder(): void;
