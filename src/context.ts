import * as uuid from 'uuid';

const identifier_secret = Symbol();

export type Identifier = string;

export function createIdentifier(): Identifier {
    return uuid.v4();
}

export type ProxyEvent =
{
    kind: 'get',
    id: Identifier,
    field: PropertyKey,
    success: boolean,
} | {
    kind: 'set',
    id: Identifier,
    field: PropertyKey,
    value: any,
} | {
    kind: 'delete',
    id: Identifier,
    field: PropertyKey,
    success: boolean,
} | {
    kind: 'new-obj',
    id: Identifier
};

export type Value = number | string;

export const trackingSymbol = Symbol();

interface Tracked { };

export function isTracked(o: any): o is Tracked {
    return o[trackingSymbol] !== undefined;
}

export function getIdentifier(o: Tracked): Identifier {
    return (o as any)[trackingSymbol];
}

export class Context {
    mapping: Map<Identifier, Tracked>;
    listeners: Map<Symbol, (event: ProxyEvent) => void>;
    constructor() {
        this.mapping = new Map();
        this.listeners = new Map();
    }

    addListener(listener: (event: ProxyEvent) => void): () => void {
        let symb = Symbol();
        this.listeners.set(symb, listener);
        return () => {
            this.listeners.delete(symb);
        }
    }

    dispatch(event: ProxyEvent) {
        for (const listener of this.listeners.values()) {
            listener(event);
        }
    }

    recordGet(field: PropertyKey, success: boolean, id: Identifier) {
        this.dispatch( {
            kind: 'get',
            field: field,
            id: id,
            success: success,
        });
    }

    recordSet(field: PropertyKey, value: any, id: Identifier) {
        this.dispatch({
            kind: 'set',
            id: id,
            field: field,
            value: value,
        });
    }

    recordDelete(field: PropertyKey, success: boolean, id: Identifier) {
        this.dispatch({
            kind: 'delete',
            field: field,
            id: id,
            success: success,
        });
    }

    recordNewObject(id: Identifier) {
        this.dispatch({
            kind: 'new-obj',
            id: id,
        })
    }
}
