import { Context, Identifier, isTracked, getIdentifier, Value, IdentifierOrValue, createIdentifier } from './context';
import { proxy_object } from './object';
export { Value, ProxyEvent, IdentifierOrValue,  getIdentifier, Identifier } from './context';

export function room(): [Context, any] {
    const context = new Context();
    var id = assimilate_top(context, {});
    return [context, context.mapping.get((id as any).id)]
}

export function assimilate_object(context: Context, o: any, visited: Map<any, any>): Identifier {
    const sym = createIdentifier();

    function ass_this(ctx: Context, value: any): IdentifierOrValue {
        return assimilate_bot(ctx, value, visited);
    }

    let object = proxy_object(context, ass_this, sym);

    for (const k in o) {
        object[k] = o[k];
    }

    context.mapping.set(sym, object);
    return sym;
}

export function assimilate_bot(
    context: Context,
    value: any,
    visited: Map<any, IdentifierOrValue>): IdentifierOrValue {

    const alreadyVisited = visited.get(value);
    if (alreadyVisited !== undefined) {
        return alreadyVisited;
    }

    if (isTracked(value)) {
        const identifier: IdentifierOrValue = {
            type: 'identifier',
            id: getIdentifier(value),
        };
        return identifier;
    }

    if (typeof value === 'object') {
        const res = assimilate_object(context, value, visited);
        const res_mod: IdentifierOrValue = { type: 'identifier', id: res, };
        visited.set(value, res_mod);
        return res_mod;
    }

    return { type: 'value', value: value };
}

export function assimilate_top(context: Context, value: any): IdentifierOrValue {
    const visited = new Map();
    return assimilate_bot(context, value, visited);
}
