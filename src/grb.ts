import { Context, Identifier, isTracked, getIdentifier, Value } from './context';
import { proxy_object } from './object';
export { Value, ProxyEvent, getIdentifier } from './context';

export function room(): [Context, any] {
    const context = new Context();
    var [_, assimilated_obj] = assimilate_top(context, {});
    return [context, assimilated_obj]
}

export function assimilate_object(context: Context, o: any, visited: Map<any, any>): [Identifier, any] {
    const sym = Symbol();

    function ass_this(ctx: Context, value: any): [Identifier | Value, any] {
        return assimilate_bot(ctx, value, visited);
    }

    let object = proxy_object(context, ass_this, sym);

    for (const k in o) {
        object[k] = o[k];
    }

    context.mapping.set(sym, object);
    return [sym, object];
}

export function assimilate_bot(
    context: Context,
    value: any,
    visited: Map<any, any>): [Identifier | Value, any] {

    if (visited.has(value)) {
        return visited.get(value);
    }

    if (isTracked(value)) {
        return [getIdentifier(value), value]
    }

    if (typeof value === 'object') {
        const res = assimilate_object(context, value, visited);
        visited.set(value, res);
        return res;
    }

    return [value, value];
}

export function assimilate_top(context: Context, value: any): [Identifier | Value, any] {
    const visited = new Map();
    return assimilate_bot(context, value, visited);
}
