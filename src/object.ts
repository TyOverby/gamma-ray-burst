import {
    Context,
    Identifier,
    Value,
    isIdentifier,
    trackingSymbol,
    isTracked,
    getIdentifier,
} from "./context";

type AssimilateFunc = (ctx: Context, value: any) => [Identifier | Value, any];

export function proxy_object(
    context: Context,
    assimilate: AssimilateFunc,
    myIdent: Identifier) {

    const fields = new Map<PropertyKey, Identifier | Value>();
    context.recordNewObject(myIdent);

    var proxy = new Proxy({}, {
        getPrototypeOf(target: any): object | null {
            return {}
        },
        setPrototypeOf(target: any, v: any): boolean {
            throw "NOT YET IMPLEMENTED";
        },
        isExtensible(target: any): boolean {
            return true;
        },
        preventExtensions(target: any): boolean {
            throw "NOT YET IMPLEMENTED";
        },
        getOwnPropertyDescriptor(target: any, p: PropertyKey): PropertyDescriptor | undefined {
            return {
                configurable: true,
                enumerable: true,
                writable: true,
                value: proxy[p],
            };
        },
        has(target: any, p: PropertyKey): boolean {
            return fields.has(p);
        },
        get(target: any, p: PropertyKey, receiver: any): any {
            if (p === trackingSymbol) { return myIdent; }

            const v = fields.get(p);
            const success = v !== undefined;
            context.recordGet(p, success, myIdent);
            if (v !== undefined && isIdentifier(v)) {
                return context.mapping.get(v);
            }
            return v;
        },
        set(target: any, p: PropertyKey, value: any, receiver: any): boolean {
            // If we are already tracking this object, just get the identifier
            // out of it, and use that instead of attempting to assimilate
            const [ident, object] = assimilate(context, value);
            fields.set(p, ident);
            context.recordSet(p, object, myIdent);
            return true;
        },
        deleteProperty(target: any, p: PropertyKey): boolean {
            if (fields.has(p)) {
                fields.delete(p);
                context.recordDelete(p, true, myIdent);
                return true;
            } else {
                context.recordDelete(p, false, myIdent);
                return false;
            }
        },
        defineProperty(target: any, p: PropertyKey, attributes: PropertyDescriptor): boolean {
            const value = attributes.value;
            proxy[p] = value;
            return true;
        },
        enumerate(target: any): PropertyKey[] {
            return Array.from(fields.keys());
        },
        ownKeys(target: any): PropertyKey[] {
            return Array.from(fields.keys());
        },
        apply(target: any, thisArg: any, argArray?: any): any {
            throw "NOT YET IMPLEMENTED";
        },
        construct(target: any, argArray: any, newTarget?: any): object {
            throw "NOT YET IMPLEMENTED";
        }
    });

    return proxy;
}
