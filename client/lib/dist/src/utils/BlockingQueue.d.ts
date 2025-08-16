export declare class BlockingQueue<T> {
    private _promises;
    private _resolvers;
    constructor();
    private _add;
    enqueue(t: T): void;
    dequeue(): Promise<T>;
    isEmpty(): boolean;
    isBlocked(): boolean;
    get length(): number;
}
